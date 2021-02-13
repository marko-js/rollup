import fs from "mz/fs";
import path from "path";
import { PluginImpl } from "rollup";
import { createFilter } from "@rollup/pluginutils";
import ConcatMap from "concat-with-sourcemaps";

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

const DEFAULT_COMPILER = require.resolve("@marko/compiler");
const IS_MARKO_RUNTIME = /\/marko\/(src|dist)\/runtime\//;
const SPLIT_COMPONENT_REG = /[/.]component-browser(?:\.[^.]+)?$/;
const PREFIX_REG = /^\0marko-[^:]+:/;
const VIRTUAL_PREFIX = "\0marko-virtual:";
const HYDRATE_PREFIX = "\0marko-hydrate:";
const DEPS_PREFIX = "\0marko-dependencies:";
const RESOLVE_OPTS = { skipSelf: true };

const plugin: PluginImpl<{
  _cache?: Map<string, unknown>;
  compiler?: string;
  include?: Parameters<typeof createFilter>[0];
  exclude?: Parameters<typeof createFilter>[1];
  hydrate?: boolean;
  runtimeId?: string;
  initComponents?: boolean;
  babelConfig?: any;
}> = (options = {}) => {
  const { hydrate = false, initComponents = true, runtimeId } = options;
  const filter = createFilter(options.include, options.exclude);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const compiler = require(options.compiler || DEFAULT_COMPILER);
  const virtualFiles: Map<string, string> = new Map();
  const cache: Map<string, CompilationResult> = options._cache || new Map();
  const babelConfig = Object.assign({}, options.babelConfig);
  babelConfig.caller = Object.assign(
    {
      name: "@marko/rollup",
      supportsStaticESM: true,
      supportsDynamicImport: true,
      supportsTopLevelAwait: true,
      supportsExportNamespaceFrom: true,
    },
    babelConfig.caller
  );

  const markoConfig = {
    cache,
    babelConfig,
    output: "dom",
    sourceMaps: true,
  };

  return {
    name: "marko/dom",
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

        onwarn && onwarn(warning, warn);
      };

      return inputOptions;
    },
    async resolveId(importee, importer) {
      if (importer) {
        const importerPrefixMatch = PREFIX_REG.exec(importer);
        const importeePrefixMatch = PREFIX_REG.exec(importee);

        if (importeePrefixMatch || importerPrefixMatch) {
          let importeePrefix = "";

          if (importerPrefixMatch) {
            importer = importer.slice(importerPrefixMatch[0].length);
          }

          if (importeePrefixMatch) {
            importeePrefix = importeePrefixMatch[0];
            importee = importee.slice(importeePrefix.length);

            if (importeePrefix === VIRTUAL_PREFIX) {
              return path.resolve(importer, "..", importee);
            }

            if (importer === importee) {
              return importeePrefix + importee;
            }
          }

          const resolved = await this.resolve(importee, importer, RESOLVE_OPTS);

          if (resolved && importeePrefix) {
            resolved.id = importeePrefix + resolved.id;
          }

          return resolved;
        }
      } else if (hydrate && isMarkoFile(importee)) {
        return (initComponents ? HYDRATE_PREFIX : DEPS_PREFIX) + importee;
      }

      return null;
    },
    async load(id) {
      if (virtualFiles.has(id)) {
        return virtualFiles.get(id)!;
      }

      const prefixMatch = PREFIX_REG.exec(id);

      if (prefixMatch) {
        const [prefix] = prefixMatch;
        const filePath = id.slice(prefix.length);
        return await fs.promises.readFile(filePath, "utf-8");
      }

      return null;
    },
    async transform(source, id) {
      const prefixMatch = PREFIX_REG.exec(id);
      let prefix: string | undefined;

      if (prefixMatch) {
        prefix = prefixMatch[0];
        id = id.slice(prefix.length);
      }

      const isHydrate = prefix === HYDRATE_PREFIX;
      const isDeps = prefix === DEPS_PREFIX;

      if (!isMarkoFile(id) || !filter(id)) {
        return null;
      }

      // The hydrate prefix is used for the very top level templates,
      // it causes their dependencies to be loaded and then tells Marko to initialize.
      if (isHydrate) {
        return [
          importStr(DEPS_PREFIX + id),
          importStr("marko/components", "components"),
          `components.init(${runtimeId ? JSON.stringify(runtimeId) : ""})`,
        ].join(";");
      }

      let compiled = cache.get(id);

      if (!compiled) {
        compiled = (await compiler.compile(
          source,
          id,
          markoConfig
        )) as CompilationResult;
        cache.set(id, compiled);
        this.addWatchFile(id);
      }

      const { code, meta, map } = compiled;
      const deps: string[] = [];

      if (meta.watchFiles) {
        for (const watchFile of meta.watchFiles) {
          this.addWatchFile(watchFile);
        }
      }

      if (meta.deps) {
        for (const dep of meta.deps) {
          if (typeof dep === "string") {
            deps.push(importStr(dep));
          } else if (dep.virtualPath) {
            virtualFiles.set(path.resolve(id, "..", dep.virtualPath), dep.code);
            deps.push(importStr(VIRTUAL_PREFIX + dep.virtualPath));
          }
        }
      }

      // dependencies is active when we are loading an entry page component.
      // We skip including the code for the component and just include
      // it's dependencies until we find a class component.
      if (isDeps) {
        if (meta.component) {
          if (SPLIT_COMPONENT_REG.test(meta.component)) {
            // Split components (component-browser.js) do not register themselves, so we inline code to do this manually.
            deps.push(
              importStr("marko/components", "components"),
              importStr(meta.component, "component"),
              `components.register(${JSON.stringify(meta.id)}, component)`
            );
          } else {
            deps.push(importStr(meta.component));
          }
        }

        if (meta.tags) {
          for (const dep of meta.tags) {
            if (isMarkoFile(dep)) {
              deps.push(importStr(DEPS_PREFIX + dep));
            }
          }
        }
      } else {
        const concat = new ConcatMap(true, "", ";");
        concat.add(null, deps.join(";"));
        concat.add(id, code, map as Parameters<typeof concat.add>[2]);
        return {
          code: concat.content.toString(),
          sourcemap: concat.sourceMap,
        };
      }

      return {
        code: deps.join(";"),
        sourcemap: "",
      };
    },
    generateBundle() {
      if (!options._cache) {
        cache.clear();
      }
    },
  };
};

function isMarkoFile(file: string) {
  return path.extname(file) === ".marko";
}

function importStr(request: string, as?: string) {
  const id = JSON.stringify(request);

  if (as) {
    return `import ${as} from ${id}`;
  }

  return `import ${id}`;
}

export default plugin;
