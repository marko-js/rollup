import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { create } from "../../..";
const marko = create();

export default {
  external: (id: string): boolean => id.startsWith("marko/"),
  input: "src/index.marko",
  plugins: [
    marko.browser(),
    nodeResolve({
      browser: true,
      extensions: [".js", ".marko"],
    }),
    commonjs({
      extensions: [".js", ".marko"],
    }),
  ],
};
