import os from "os";
import fs from "fs";
import path from "path";
import * as rollup from "rollup";
import { createHash } from "crypto";
import type * as Compiler from "@marko/compiler";
import getServerEntryTemplate from "./server-entry-template";

export interface Options {
  // Override the Marko compiler instance being used. (primarily for tools wrapping this module)
  compiler?: string;
  // Sets a custom runtimeId to avoid conflicts with multiple copies of Marko on the same page.
  runtimeId?: string;
  // Overrides the Marko translator being used.
  translator?: string;
  // Overrides the Babel config that Marko will use.
  babelConfig?: Compiler.Config["babelConfig"];
}

interface Channel {
  isActive: boolean;
  tempDir: Promise<string>;
  getBundleWriter(): {
    init(options: rollup.RollupOptions): Promise<void>;
    write(bundle: rollup.OutputBundle): Promise<void>;
  };
}

interface SerializedChunk extends rollup.OutputChunk {
  code: never;
  map: never;
  exports: never;
  modules: never;
  facadeModuleId: never;
  importedBindings: never;
}

interface SerializedAsset extends rollup.OutputAsset {
  source: never;
}

type SerializedChunks = (SerializedChunk | SerializedAsset)[];

interface InternalOptions extends ReturnType<typeof normalizeOpts> {
  channel: Channel;
}

const VIRTUAL_FILES = new Map<string, { code: string; map?: unknown }>();
const DEFAULT_COMPILER = require.resolve("@marko/compiler");
const PREFIX_REG = /^\0?marko-[^:]+:/;
const BROWSER_ENTRY_PREFIX = "\0marko-browser-entry:";
const SERVER_ENTRY_PREFIX = "\0marko-server-entry:";
const RESOLVE_OPTS = { skipSelf: true };

const COMMON_PLUGIN = {
  /**
   * Hides warnings about circular dependencies and an eval (in dev mode I promise!)
   * from Marko's source.
   */
  options(inputOptions) {
    const { onwarn } = inputOptions;
    inputOptions.onwarn = (warning, warn) => {
      if (
        (warning.code === "CIRCULAR_DEPENDENCY" || warning.code === "EVAL") &&
        /\/marko\/(src|dist)\/runtime\//.test(
          warning.importer || warning.id || ""
        )
      ) {
        return;
      }

      if (onwarn) {
        onwarn(warning, warn);
      } else {
        warn(warning);
      }
    };

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
  server(opts?: Options): rollup.Plugin;
  browser(opts?: Options): rollup.Plugin;
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
    server(opts?: Options) {
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
    browser(opts?: Options) {
      const normalizedOpts = normalizeOpts("dom", opts) as InternalOptions;
      normalizedOpts.channel = channel;
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
  let wroteEmptyManifest = false;
  let registeredRollupTag: false | string = false;
  const bundlesPerWriter: (rollup.OutputBundle | null)[][] = [];

  // This code is a bit gnarly, but in essence what it does is allow
  // the server compiler to keep track of the number of browser compilers
  // and finally, once they are all done, inline the asset manifest into the
  // final server bundle.
  channel.getBundleWriter = () => {
    const bundles: (rollup.OutputBundle | null)[] = [];
    bundlesPerWriter.push(bundles);
    return {
      async init(options: rollup.RollupOptions) {
        bundles.length = Array.isArray(options.output)
          ? options.output.length
          : 1;

        for (let i = bundles.length; i--; ) {
          bundles[i] = null;
        }

        if (isWatch && !wroteEmptyManifest) {
          // By writing an empty manifest when we start, we signal to the bundled server
          // that assets are pending for the browser compiler.
          wroteEmptyManifest = true;
          await fs.promises.writeFile(await getManifestFile(channel), "");
        }
      },
      async write(bundle) {
        const nextBundleIndex = bundles.indexOf(null);
        bundles[nextBundleIndex] = bundle;
        if (nextBundleIndex + 1 === bundles.length) {
          // This compiler is done, lets check the others.
          for (const curBundles of bundlesPerWriter) {
            if (curBundles === bundles) {
              continue;
            }

            for (const curBundle of curBundles) {
              if (curBundle === null) {
                return;
              }
            }
          }

          // ready to write manifest!
          const manifest: SerializedChunks[] = [];
          for (const curBundles of bundlesPerWriter) {
            for (const curBundle of curBundles) {
              manifest.push(serializeBundle(curBundle!));
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
    buildStart() {
      isWatch = this.meta.watchMode;

      if (!registeredRollupTag) {
        // Here we inject either the watchMode rollup tag, or the build one.
        registeredRollupTag = path.resolve(
          __dirname.slice(0, __dirname.lastIndexOf("rollup") + 6),
          "components",
          this.meta.watchMode ? "rollup-watch.marko" : "rollup.marko"
        );
        opts.compiler.taglib.register("@marko/rollup", {
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

      const { code, map, meta } = await opts.compiler.compile(
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

        // We write out all discovered server entries to a temp file
        // which is read by the browser compilers.
        await fs.promises.writeFile(
          await getServerEntriesFile(channel),
          JSON.stringify(serverEntries)
        );
      }
    },
  };
}

function browserPlugin(opts: InternalOptions): rollup.Plugin {
  const { channel } = opts;
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
  const writer = channel.isActive ? channel.getBundleWriter() : undefined;

  return {
    ...COMMON_PLUGIN,
    name: "marko/browser",
    async options(inputOptions) {
      // This communicates back with the server compiler (if one exists)
      // to tell it that compiling assets for this browser compiler has started.
      await writer?.init(inputOptions);
      return COMMON_PLUGIN.options!.call(this, inputOptions);
    },
    async buildStart(inputOptions) {
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
          inputOptions.input = JSON.parse(
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

      const { code, map, meta } = await opts.compiler.compile(
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
        await writer?.write(bundle);
      }
    },
    async writeBundle(_outputOptions, bundle) {
      // We prefer to do this in write mode since we want to wait until all
      // plugins have run.
      await writer?.write(bundle);
    },
  };
}

function normalizeOpts(
  output: Compiler.Config["output"] | undefined,
  opts: Options = {}
) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    compiler: require(opts.compiler || DEFAULT_COMPILER) as typeof Compiler,
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
  return `${filename
    .replace(/(\/(index|template)|)\..*$/, "")
    .replace(/^.*\//, "")}_${createHash("MD5")
    .update(path.relative(process.cwd(), filename))
    .digest("hex")
    .slice(0, 4)}`;
}

/**
 * Takes a rollup output bundle and filters out some properties
 * that would be too large or pointless to include in the final
 * manifest.
 */
function serializeBundle(bundle: rollup.OutputBundle) {
  const chunks: SerializedChunks = [];
  for (const fileName in bundle) {
    const chunk = bundle[fileName];

    if (chunk.type === "asset") {
      chunks.push({
        fileName,
        type: "asset",
      } as SerializedAsset);
    } else {
      chunks.push({
        fileName,
        type: "chunk",
        name: chunk.name,
        imports: chunk.imports,
        isEntry: chunk.isEntry,
        dynamicImports: chunk.dynamicImports,
        isDynamicEntry: chunk.isDynamicEntry,
        referencedFiles: chunk.referencedFiles,
        isImplicitEntry: chunk.isImplicitEntry,
        implicitlyLoadedBefore: chunk.implicitlyLoadedBefore,
      } as SerializedChunk);
    }
  }
  return chunks;
}

async function getServerEntriesFile(channel: Channel) {
  return path.join(await channel.tempDir, "entries.json");
}

async function getManifestFile(channel: Channel) {
  return path.join(await channel.tempDir, "manifest.json");
}

function isEmpty(obj: unknown) {
  for (const _ in obj as Record<string, unknown>) {
    return false;
  }

  return true;
}
