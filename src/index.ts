import os from "os";
import fs from "fs";
import path from "path";
import { Buffer } from "buffer";
import * as rollup from "rollup";
import { createHash } from "crypto";
import type * as Compiler from "@marko/compiler";
import getServerEntryTemplate from "./server-entry-template";

interface BaseOptions {
  // Override the Marko compiler instance being used. (primarily for tools wrapping this module)
  compiler?: string;
  // Sets a custom runtimeId to avoid conflicts with multiple copies of Marko on the same page.
  runtimeId?: string;
  // Overrides the Marko translator being used.
  translator?: string;
  // Overrides the Babel config that Marko will use.
  babelConfig?: Compiler.Config["babelConfig"];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ServerOptions extends BaseOptions {}
export interface BrowserOptions extends BaseOptions {
  serialize?(chunks: (rollup.OutputChunk | rollup.OutputAsset)[]): unknown;
}

interface Channel {
  isActive: boolean;
  tempDir: Promise<string>;
  getBundleWriter(): {
    init(options: rollup.RollupOptions): Promise<void>;
    write(bundle: unknown): Promise<void>;
  };
}

interface SerializedChunk extends rollup.OutputChunk {
  size: number;
  map: never;
  code: never;
  exports: never;
  modules: never;
  facadeModuleId: never;
  importedBindings: never;
}

interface SerializedAsset extends rollup.OutputAsset {
  size: number;
  source: never;
}

interface InternalOptions extends ReturnType<typeof normalizeOpts> {
  channel: Channel;
  serialize?: BrowserOptions["serialize"];
}

const VIRTUAL_FILES = new Map<string, { code: string; map?: unknown }>();
const PREFIX_REG = /^\0?marko-[^:]+:/;
const BROWSER_ENTRY_PREFIX = "\0marko-browser-entry:";
const SERVER_ENTRY_PREFIX = "\0marko-server-entry:";
const RESOLVE_OPTS = { skipSelf: true };
const PENDING_MARKER = {};

const COMMON_PLUGIN = {
  /**
   * Hides warnings about circular dependencies and an eval (in dev mode I promise!)
   * from Marko's source.
   */
  options(inputOptions) {
    hideWarning(
      inputOptions,
      (warning) =>
        (warning.code === "CIRCULAR_DEPENDENCY" || warning.code === "EVAL") &&
        /\/marko\/(src|dist)\/runtime\//.test(
          warning.importer || warning.id || ""
        )
    );
    return inputOptions;
  },
  /**
   * Handles resolving our custom `marko-` prefix for entrypoints, as well
   * as our virtual files.
   */
  async resolveId(importee: string, importer: string | undefined) {
    const importerPrefixMatch = importer && PREFIX_REG.exec(importer);
    const importeePrefixMatch = PREFIX_REG.exec(importee);
    let importeePrefix = "";

    if (importerPrefixMatch) {
      importer = importer!.slice(importerPrefixMatch[0].length);
    }

    if (importeePrefixMatch) {
      importeePrefix = importeePrefixMatch[0];
      importee = importee.slice(importeePrefix.length);
    }

    if (importer) {
      const virtualFile = path.resolve(importer, "..", importee);

      if (VIRTUAL_FILES.has(virtualFile)) {
        return { id: virtualFile } as rollup.ResolvedId;
      }
    }

    if (importeePrefixMatch || importerPrefixMatch) {
      const resolved = await this.resolve(importee, importer, RESOLVE_OPTS);

      if (resolved) {
        resolved.id = importeePrefix + resolved.id;
      }

      return resolved;
    }

    return null;
  },

  /**
   * Handles loading virtual files, and also ensures any `marko-` prefixed
   * modules get loaded as normal.
   */
  load(id) {
    const virtualFile = VIRTUAL_FILES.get(id);

    if (virtualFile) {
      return virtualFile;
    }

    const prefixMatch = PREFIX_REG.exec(id);

    if (prefixMatch) {
      return fs.promises.readFile(id.slice(prefixMatch[0].length), "utf-8");
    }

    return null;
  },
} as Omit<rollup.Plugin, "name">;

// Expose a linked browser/server plugin instance by default.
export default create();

/**
 * Not likely to be needed, but this would allow you to have multiple independent isomorphic applications
 * built in the same process.
 */
export function create(): {
  server(opts?: ServerOptions): rollup.Plugin;
  browser(opts?: BrowserOptions): rollup.Plugin;
} {
  // The channel is used when this linked browser/server plugin
  // has both the server and browser in use. It is used to communicate
  // between the server compiler and browser compilers.
  // Primarily the server tells the browser compilers what the Marko entries are,
  // and the browser compilers tell the server what assets were generated.
  const channel = { isActive: false } as Channel;
  const initChannel = () => {
    if (!channel.isActive) {
      channel.isActive = true;
      channel.tempDir = fs.promises.mkdtemp(
        path.join(os.tmpdir(), "marko-rollup-")
      );
    }
  };
  let usingServer = false;
  let usingBrowser = false;

  return {
    /**
     * Create a Marko plugin for compiling server side Marko templates.
     */
    server(opts?: ServerOptions) {
      if (usingServer) {
        throw new Error(
          "@marko/rollup: You can only create one server compiler per linked instance. You must use the create() API otherwise."
        );
      }

      const normalizedOpts = normalizeOpts("html", opts) as InternalOptions;
      normalizedOpts.channel = channel;
      usingServer = true;
      if (usingBrowser) initChannel();
      return serverPlugin(normalizedOpts);
    },
    /**
     * Create a Marko plugin for compiling client side Marko templates.
     */
    browser(opts?: BrowserOptions) {
      const normalizedOpts = normalizeOpts("dom", opts) as InternalOptions;
      normalizedOpts.channel = channel;
      normalizedOpts.serialize = opts?.serialize;
      usingBrowser = true;
      if (usingServer) initChannel();
      return browserPlugin(normalizedOpts);
    },
  };
}

function serverPlugin(opts: InternalOptions): rollup.Plugin {
  const { channel } = opts;
  const serverEntries: { [x: string]: string } = {};
  const chunksNeedingManifest: {
    dir: string;
    chunk: rollup.OutputChunk;
    isWrite: boolean;
  }[] = [];
  let isWatch = false;
  let compiler: typeof Compiler;
  let wroteEmptyManifest = false;
  let hasNewServerEntries = true;
  let registeredRollupTag: false | string = false;
  const bundlesPerWriter: unknown[][] = [];

  // This code is a bit gnarly, but in essence what it does is allow
  // the server compiler to keep track of the number of browser compilers
  // and finally, once they are all done, inline the asset manifest into the
  // final server bundle.
  channel.getBundleWriter = () => {
    const bundles: unknown[] = [];
    bundlesPerWriter.push(bundles);
    return {
      async init(options: rollup.RollupOptions) {
        bundles.length = Array.isArray(options.output)
          ? options.output.length
          : 1;

        for (let i = bundles.length; i--; ) {
          bundles[i] = PENDING_MARKER;
        }

        if (isWatch && !wroteEmptyManifest) {
          // By writing an empty manifest when we start, we signal to the bundled server
          // that assets are pending for the browser compiler.
          wroteEmptyManifest = true;
          await fs.promises.writeFile(await getManifestFile(channel), "");
        }
      },
      async write(bundle) {
        const nextBundleIndex = bundles.indexOf(PENDING_MARKER);
        bundles[nextBundleIndex] = bundle;
        if (nextBundleIndex + 1 === bundles.length) {
          // This compiler is done, lets check the others.
          for (const curBundles of bundlesPerWriter) {
            if (curBundles === bundles) {
              continue;
            }

            for (const curBundle of curBundles) {
              if (curBundle === PENDING_MARKER) {
                return;
              }
            }
          }

          // ready to write manifest!
          const manifest: unknown[] = [];
          for (const curBundles of bundlesPerWriter) {
            for (const curBundle of curBundles) {
              manifest.push(curBundle);
            }
          }

          if (isWatch) {
            // In watch mode the manifest is written to a temp file
            // which is then automatically watched via the `rollup-watch.marko` tag.
            wroteEmptyManifest = false;
            await fs.promises.writeFile(
              await getManifestFile(channel),
              JSON.stringify(manifest, null, 2)
            );
          } else {
            // Otherwise we find which rollup chunks reference the <rollup> tag
            // and inline the manifest at the bottom.
            const manifestStr = JSON.stringify(manifest);
            const writes: Promise<unknown>[] = [];

            while (chunksNeedingManifest.length) {
              const { dir, chunk, isWrite } = chunksNeedingManifest.pop()!;
              chunk.code += `;var __MARKO_MANIFEST__=${manifestStr};\n`;

              if (isWrite) {
                writes.push(
                  fs.promises.writeFile(
                    path.join(dir, chunk.fileName),
                    chunk.code
                  )
                );
              }
            }

            await Promise.all(writes);
          }
        }
      },
    };
  };
  return {
    ...COMMON_PLUGIN,
    name: "marko/server",
    async buildStart() {
      compiler ??= await opts.compiler;
      isWatch = this.meta.watchMode;

      if (!registeredRollupTag) {
        // Here we inject either the watchMode rollup tag, or the build one.
        registeredRollupTag = path.resolve(
          __dirname.slice(0, __dirname.lastIndexOf("rollup") + 6),
          "components",
          this.meta.watchMode ? "rollup-watch.marko" : "rollup.marko"
        );
        compiler.taglib.register("@marko/rollup", {
          "<rollup>": {
            template: registeredRollupTag,
          },
        });
      }
    },
    async resolveId(importee, importer, importOpts) {
      // Besides what the common plugin is doing,
      // this code looks for `.marko` files that are imported from non `.marko` files.
      // That heuristic is what we use to tell which `marko` files to request assets for.
      // This code prefixes those `.marko` files with a marker to know that assets are needed.
      return COMMON_PLUGIN.resolveId!.call(
        this,
        (channel.isActive &&
        importer &&
        isMarkoFile(importee) &&
        !isMarkoFile(importer)
          ? SERVER_ENTRY_PREFIX
          : "") + importee,
        importer,
        importOpts
      );
    },
    async load(id) {
      if (channel.isActive) {
        if (id.startsWith(SERVER_ENTRY_PREFIX)) {
          // This code is looking for the markers added from the resolver above.
          // It then returns a wrapper template that tells the <rollup> tag what
          // entry point we are rendering.
          //
          // We also keep track of all of the Marko entry files here to tell
          // the browser compilers what to bundle.
          const fileName = id.slice(SERVER_ENTRY_PREFIX.length);
          const entryId = toEntryId(fileName);
          serverEntries[entryId] = fileName;
          hasNewServerEntries = true;
          return getServerEntryTemplate({
            entryId,
            runtimeId: opts.markoConfig.runtimeId,
            templatePath: `./${path.basename(id)}`,
            manifestPath:
              this.meta.watchMode && (await getManifestFile(channel)),
          });
        }
      }

      return COMMON_PLUGIN.load!.call(this, id);
    },
    async transform(source, id) {
      if (!isMarkoFile(id)) {
        return null;
      }

      const { code, map, meta } = await compiler.compile(
        source,
        id.replace(PREFIX_REG, ""),
        opts.markoConfig
      );

      for (const watchFile of meta.watchFiles!) {
        this.addWatchFile(watchFile);
      }

      return { code, map };
    },

    async generateBundle(outputOptions, bundle, isWrite) {
      if (channel.isActive) {
        const dir = outputOptions.dir
          ? path.resolve(outputOptions.dir)
          : path.resolve(outputOptions.file!, "..");
        let hasRollupTag = false;

        // Here we are looking for any chunk which included the `<rollup>` tag.
        for (const fileName in bundle) {
          const chunk = bundle[fileName];
          if (chunk.type === "chunk") {
            for (const id in chunk.modules) {
              if (id === registeredRollupTag) {
                if (!isWatch) {
                  // When in build mode, we keep track of the chunks referencing the rollup tag
                  // in order to inject the asset manifest later.
                  chunksNeedingManifest.push({ dir, chunk, isWrite });
                }

                hasRollupTag = true;
                break;
              }
            }
          }
        }

        if (!hasRollupTag) {
          this.warn(
            "The <rollup> tag was not discovered when bundling the server. This means no client side assets will be served to the browser."
          );
        }

        if (hasNewServerEntries) {
          hasNewServerEntries = false;
          // We write out all discovered server entries to a temp file
          // which is read by the browser compilers.
          await fs.promises.writeFile(
            await getServerEntriesFile(channel),
            JSON.stringify(serverEntries)
          );
        }
      }
    },
  };
}

function browserPlugin(opts: InternalOptions): rollup.Plugin {
  const { channel, serialize = defaultSerialize } = opts;
  const markoConfig: Compiler.Config = {
    ...opts.markoConfig,
    resolveVirtualDependency(from, dep) {
      const resolved = path.resolve(from, "..", dep.virtualPath);
      VIRTUAL_FILES.set(resolved, dep);
      return dep.virtualPath;
    },
  };
  const hydrateConfig: Compiler.Config = {
    ...markoConfig,
    output: "hydrate",
  };
  let compiler: typeof Compiler;
  let writer: undefined | ReturnType<Channel["getBundleWriter"]>;
  let currentServerEntries: { [x: string]: string };

  return {
    ...COMMON_PLUGIN,
    name: "marko/browser",
    async options(inputOptions) {
      // This communicates back with the server compiler (if one exists)
      // to tell it that compiling assets for this browser compiler has started.
      if (channel.isActive) {
        (writer ??= channel.getBundleWriter()).init(inputOptions);
      }

      hideWarning(inputOptions, (warning) =>
        Boolean(
          currentServerEntries &&
            warning.code === "EMPTY_BUNDLE" &&
            currentServerEntries[warning.chunkName!]
        )
      );

      return COMMON_PLUGIN.options!.call(this, inputOptions);
    },
    async buildStart(inputOptions) {
      compiler ??= await opts.compiler;
      if (channel.isActive) {
        // Here we load the temp file (created by the server compiler) with the
        // list of Marko files that need to be bundled.
        const serverEntriesFile = await getServerEntriesFile(channel);
        this.addWatchFile(serverEntriesFile);

        if (!isEmpty(inputOptions.input)) {
          this.error(
            `Setting the "input" option when using both marko.browser() and marko.server() plugins is not supported.`
          );
        }

        try {
          inputOptions.input = currentServerEntries = JSON.parse(
            await fs.promises.readFile(serverEntriesFile, "utf-8")
          );
        } catch (err) {
          this.error(
            `The "server" rollup config must be ran before the "browser" rollup config.`
          );
        }

        if (isEmpty(inputOptions.input)) {
          this.error("No Marko files were found when compiling the server.");
        }
      }
    },
    resolveId(importee, importer, importOpts) {
      // Besides what the common plugin is doing,
      // this code checks for `.marko` files which are the imported directly
      // as the rollup `input` option. These top level Marko files are compiled
      // to include only the necessary code to "hydrate" the component in the browser.
      // This code prefixes those `.marko` files with a marker to know to treat it differently.
      return COMMON_PLUGIN.resolveId!.call(
        this,
        (!importer && isMarkoFile(importee) ? BROWSER_ENTRY_PREFIX : "") +
          importee,
        importer,
        importOpts
      );
    },
    async transform(source, id) {
      if (!isMarkoFile(id)) {
        return null;
      }

      const prefixMatch = PREFIX_REG.exec(id);
      let prefix: string | undefined;

      if (prefixMatch) {
        prefix = prefixMatch[0];
        id = id.slice(prefix.length);
      }

      const { code, map, meta } = await compiler.compile(
        source,
        id,
        prefix === BROWSER_ENTRY_PREFIX ? hydrateConfig : markoConfig
      );

      for (const watchFile of meta.watchFiles!) {
        this.addWatchFile(watchFile);
      }

      return { code, map };
    },
    async generateBundle(_outputOptions, bundle, isWrite) {
      if (!isWrite) {
        // This communicates back with the server compiler (if one exists)
        // to tell it that the assets for this browser compiler has completed.
        await writer?.write(serialize(Object.values(bundle)));
      }
    },
    async writeBundle(_outputOptions, bundle) {
      // We prefer to do this in write mode since we want to wait until all
      // plugins have run.
      await writer?.write(serialize(Object.values(bundle)));
    },
  };
}

function normalizeOpts(
  output: Compiler.Config["output"] | undefined,
  opts: BaseOptions = {}
) {
  return {
    compiler: import(opts.compiler || "@marko/compiler") as Promise<
      typeof Compiler
    >,
    markoConfig: {
      output,
      sourceMaps: true,
      runtimeId: opts.runtimeId,
      writeVersionComment: false,
      cache: new Map<string, Compiler.CompileResult>(),
      babelConfig: {
        ...opts.babelConfig,
        caller: {
          name: "@marko/rollup",
          supportsStaticESM: true,
          supportsDynamicImport: true,
          supportsTopLevelAwait: true,
          supportsExportNamespaceFrom: true,
          ...opts.babelConfig?.caller,
        },
      },
    } as Compiler.Config,
  };
}

function isMarkoFile(file: string) {
  return file.endsWith(".marko");
}

function toEntryId(filename: string) {
  const lastSepIndex = filename.lastIndexOf(path.sep);
  let name = filename.slice(
    lastSepIndex + 1,
    filename.indexOf(".", lastSepIndex)
  );

  if (name === "index" || name === "template") {
    name = filename.slice(
      filename.lastIndexOf(path.sep, lastSepIndex - 1) + 1,
      lastSepIndex
    );
  }

  return `${name}_${createHash("SHA1")
    .update(path.relative(process.cwd(), filename))
    .digest("base64")
    .replace(/[/+]/g, "-")
    .slice(0, 4)}`;
}

/**
 * Takes a rollup output bundle and filters out some properties
 * that would be too large or pointless to include in the final
 * manifest.
 */
function defaultSerialize(chunks: (rollup.OutputChunk | rollup.OutputAsset)[]) {
  return chunks.map((chunk) =>
    chunk.type === "asset"
      ? ({
          type: "asset",
          fileName: chunk.fileName,
          size: getSize(chunk.source),
        } as SerializedAsset)
      : ({
          type: "chunk",
          fileName: chunk.fileName,
          name: chunk.name,
          imports: chunk.imports,
          isEntry: chunk.isEntry,
          dynamicImports: chunk.dynamicImports,
          isDynamicEntry: chunk.isDynamicEntry,
          referencedFiles: chunk.referencedFiles,
          isImplicitEntry: chunk.isImplicitEntry,
          implicitlyLoadedBefore: chunk.implicitlyLoadedBefore,
          size: getSize(chunk.code),
        } as SerializedChunk)
  );
}

async function getServerEntriesFile(channel: Channel) {
  return path.join(await channel.tempDir, "entries.json");
}

async function getManifestFile(channel: Channel) {
  return path.join(await channel.tempDir, "manifest.json");
}

function getSize(source: string | Uint8Array) {
  return (
    (typeof source === "string"
      ? Buffer.byteLength(source.replace(/^\s+$/m, ""))
      : source.byteLength) || 0
  );
}

function hideWarning(
  inputOptions: rollup.InputOptions,
  shouldHide: (warning: rollup.RollupWarning) => boolean
) {
  const { onwarn } = inputOptions;
  inputOptions.onwarn = (warning, warn) => {
    if (!shouldHide(warning)) {
      if (onwarn) {
        onwarn(warning, warn);
      } else {
        warn(warning);
      }
    }
  };
}

function isEmpty(obj: unknown) {
  for (const _ in obj as Record<string, unknown>) {
    return false;
  }

  return true;
}
