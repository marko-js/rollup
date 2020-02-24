import fs from "mz/fs";
import path from "path";
import { PluginImpl } from "rollup";
import commonJSPlugin from "rollup-plugin-commonjs";
import { createFilter } from "rollup-pluginutils";

const isMarkoRuntime = /\/marko\/(src|dist)\/runtime\//;
const { transform: transformCommonJS } = commonJSPlugin({
  include: ["**/*.marko"],
  extensions: [".marko"],
  sourceMap: false
});

interface CompilationResult {
  code: string;
  meta: {
    id: string;
    component?: string;
    deps?: Array<{ path: string; virtualPath: string; code: string } | string>;
    tags?: string[];
  };
}

const DEFAULT_COMPILER = require.resolve("marko/compiler");
const SPLIT_COMPONENT_REG = /[/.]component-browser(?:\.[^.]+)?$/;
const PREFIX_REG = /^\0marko-[^:]+:/;
const VIRTUAL_PREFIX = "\0marko-virtual:";
const HYDRATE_PREFIX = "\0marko-hydrate:";
const DEPS_PREFIX = "\0marko-dependencies:";
const RESOLVE_OPTS = { skipSelf: true };

const plugin: PluginImpl<{
  compiler?: string;
  include?: Parameters<typeof createFilter>[0];
  exclude?: Parameters<typeof createFilter>[1];
  hydrate?: boolean;
  runtimeId?: string;
  initComponents?: boolean;
}> = (options = {}) => {
  const { hydrate = false, initComponents = true, runtimeId } = options;
  const filter = createFilter(options.include, options.exclude);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const compiler = require(options.compiler || DEFAULT_COMPILER);
  const virtualFiles: Map<string, string> = new Map();
  const compiledTemplates: Map<string, CompilationResult> = new Map();

  return {
    name: "marko",
    options(inputOptions) {
      const { onwarn } = inputOptions;
      inputOptions.onwarn = (warning, warn) => {
        if (
          warning.code === "CIRCULAR_DEPENDENCY" &&
          warning.importer &&
          isMarkoRuntime.test(warning.importer)
        ) {
          return;
        }

        onwarn!(warning, warn);
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
    load(id) {
      if (virtualFiles.has(id)) {
        return virtualFiles.get(id)!;
      }

      const prefixMatch = PREFIX_REG.exec(id);

      if (prefixMatch) {
        const [prefix] = prefixMatch;
        const filePath = id.slice(prefix.length);
        return fs.readFile(filePath, "utf-8");
      }

      return null;
    },
    transform(source, id) {
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
          importStr("marko/components", "__rollup_marko_runtime__"),
          `__rollup_marko_runtime__.init(${
            runtimeId ? JSON.stringify(runtimeId) : ""
          })`
        ].join(";");
      }

      let compiled = compiledTemplates.get(id);

      if (!compiled) {
        compiled = compiler.compileForBrowser(source, id, {
          writeToDisk: false
        }) as CompilationResult;

        compiledTemplates.set(id, compiled);
      }

      const { code, meta } = compiled;
      const deps: string[] = [];

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
              importStr("marko/components", "__rollup_marko_runtime__"),
              importStr(meta.component, "__rollup_marko_component__"),
              `__rollup_marko_runtime__.register(${JSON.stringify(
                meta.id
              )},__rollup_marko_component__)`
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
        // TODO: remove once Marko 5 is out with esmodule support.
        // When we have external dependencies we need to load them as commonjs imports
        // or things blow up. This hack uses the commonjs plugin to convert the Marko output
        // code to an esmodule before we concat it :shrug:.
        const esModule = transformCommonJS!.call(this, code, id);

        if (esModule) {
          deps.push(esModule.code);
        } else {
          return null;
        }
      }

      return {
        code: deps.join(";"),
        sourcemap: ""
      };
    },
    generateBundle() {
      compiledTemplates.clear();
      virtualFiles.clear();
    }
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
