import path from "path";
import { createHash } from "crypto";
import {
  rollup,
  PluginImpl,
  RollupOptions,
  RollupBuild,
  OutputOptions,
  RollupOutput,
  OutputChunk,
  OutputAsset,
} from "rollup";
import { createFilter } from "@rollup/pluginutils";
import DOMTarget from "./dom-target";

const DEFAULT_COMPILER = require.resolve("@marko/compiler");
const IS_MARKO_RUNTIME = /\/marko\/(src|dist)\/runtime\//;
const RESOLVE_OPTS = { skipSelf: true };
const CWD = process.cwd();

interface CompilationResult {
  code: string;
  map: unknown;
  meta: {
    id: string;
    component?: string;
    deps?: Array<{ path: string; virtualPath: string; code: string } | string>;
    tags?: string[];
    watchFiles?: string[];
  };
}

// add dom plugin by default

const plugin: PluginImpl<{
  compiler?: string;
  include?: Parameters<typeof createFilter>[0];
  exclude?: Parameters<typeof createFilter>[1];
  runtimeId?: string;
  babelConfig?: any;
  browser?: Omit<RollupOptions, "input"> & {
    output?: OutputOptions;
  };
}> = (options = {}) => {
  const filter = createFilter(options.include, options.exclude);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const compiler = require(options.compiler || DEFAULT_COMPILER);
  const cache: Map<string, CompilationResult> = new Map();
  const babelConfig = { ...options.babelConfig };
  babelConfig.caller = {
    name: "@marko/rollup",
    supportsStaticESM: true,
    supportsDynamicImport: true,
    supportsTopLevelAwait: true,
    supportsExportNamespaceFrom: true,
    ...babelConfig.caller,
  };

  const markoConfig = {
    cache,
    babelConfig,
    output: "html",
    sourceMaps: true,
  };

  let browserOptions:
    | (RollupOptions & {
        input?: { [entryAlias: string]: string };
        output?: OutputOptions;
      })
    | undefined;
  let browserBuild: RollupBuild | undefined;

  if (options.browser) {
    browserOptions = { ...options.browser, input: {} };
    if (browserOptions.plugins) {
      if (browserOptions.plugins.some((it) => it.name === "marko/dom")) {
        throw new Error(
          "@marko/rollup.html adds the Marko DOM plugin for you, please remove the plugin from your browser config."
        );
      }

      browserOptions.plugins.unshift(
        DOMTarget({
          _cache: cache,
          hydrate: true,
          initComponents: true,
          include: options.include,
          exclude: options.exclude,
          compiler: options.compiler,
          runtimeId: options.runtimeId,
          babelConfig: options.babelConfig,
        })
      );
    }
  }

  return {
    name: "marko/html",
    options(inputOptions) {
      const { onwarn } = inputOptions;
      inputOptions.onwarn = (warning, warn) => {
        if (
          warning.code === "CIRCULAR_DEPENDENCY" &&
          warning.importer &&
          IS_MARKO_RUNTIME.test(warning.importer)
        ) {
          return;
        }

        onwarn!(warning, warn);
      };

      return inputOptions;
    },
    outputOptions(outputOptions) {
      if (browserOptions) {
        browserOptions.output = outputOptions;
      }

      return outputOptions;
    },
    async resolveId(importee, importer) {
      if (
        browserOptions &&
        importer &&
        isMarkoFile(importee) && // We only want Marko files in the browser bundle input
        !isMarkoFile(importer)
      ) {
        const resolved = await this.resolve(importee, importer, RESOLVE_OPTS);

        if (resolved) {
          const relative = path.relative(CWD, resolved.id); // Shouldn't this be relative to the Rollup input dir ?
          browserOptions.input![toEntryId(relative)] = resolved.id; // Rollup prefers absolute paths as input
          return resolved;
        }
      }

      return null;
    },
    async transform(source, id) {
      if (!isMarkoFile(id) || !filter(id)) {
        return null;
      }

      const compiled = (await compiler.compile(
        source,
        id,
        markoConfig
      )) as CompilationResult;
      const { code, map, meta } = compiled;

      if (meta.watchFiles) {
        for (const watchFile of meta.watchFiles) {
          this.addWatchFile(watchFile);
        }
      }

      return {
        code,
        sourcemap: map,
      };
    },
    async buildEnd(err) {
      if (!err && browserOptions && Object.keys(browserOptions.input!).length) {
        browserBuild = await rollup(browserOptions);
      }

      cache.clear();
    },
    async generateBundle(outputOptions, serverBundle) {
      if (browserOptions && browserBuild) {
        const browserBundle = toBundle(
          await browserBuild.write(browserOptions.output || outputOptions)
        );

        for (const filename in browserBundle) {
          const chunk = browserBundle[filename];
          if (
            chunk.type === "chunk" &&
            chunk.isEntry &&
            browserOptions.input![chunk.name]
          ) {
            const assets = getDeps(chunk, browserBundle);
          }
        }

        browserBuild = undefined;
      }
    },
  };
};

function isMarkoFile(file: string) {
  return path.extname(file) === ".marko";
}

function toEntryId(filename: string) {
  return `${filename
    .replace(/(\/(index|template)|)\..*$/, "")
    .replace(/^.*\//, "")}_${createHash("MD5")
    .update(filename)
    .digest("hex")
    .slice(0, 4)}`;
}

function toBundle({ output }: RollupOutput) {
  const chunksByFilename: {
    [filename: string]: OutputChunk | OutputAsset;
  } = {};

  for (const chunk of output) {
    chunksByFilename[chunk.fileName] = chunk;
  }

  return chunksByFilename;
}

function getDeps(
  entry: OutputChunk,
  chunksByFilename: { [filename: string]: OutputChunk | OutputAsset }
) {
  const result = new Set<string>();
  const addImports = (cur: OutputChunk) => {
    for (const filename of cur.imports) {
      const child = chunksByFilename[filename];

      //      if (!child) debugger;

      if (child.type === "chunk") {
        addImports(child);
      }

      result.add(filename);
    }
  };

  addImports(entry);
  return result.add(entry.fileName);
}

export default plugin;
