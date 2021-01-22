import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import marko from "../../../dom-target";

export default {
  external: (id: string): boolean => id.startsWith("marko/"),
  input: "src/index.marko",
  plugins: [
    marko({
      hydrate: true,
      runtimeId: "SOME_COMPONENTS",
    }),
    nodeResolve({
      browser: true,
      extensions: [".js", ".marko"],
    }),
    commonjs({
      extensions: [".js", ".marko"],
    }),
  ],
};
