import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { create } from "../../..";
const marko = create();

export default {
  input: "src/index.js",
  external: (id: string): boolean => id.startsWith("marko/"),
  plugins: [
    marko.server(),
    nodeResolve({
      extensions: [".js", ".marko"],
    }),
    commonjs({
      extensions: [".js", ".marko"],
    }),
  ],
};
