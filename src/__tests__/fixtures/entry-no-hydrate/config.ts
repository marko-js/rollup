import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import marko from "../../../index";

export default {
  input: "src/index.marko",
  external: (id: string): boolean => id.startsWith("marko/"),
  plugins: [
    marko(),
    nodeResolve({
      browser: true,
      extensions: [".js", ".marko"],
    }),
    commonjs({
      extensions: [".js", ".marko"],
    }),
  ],
};
