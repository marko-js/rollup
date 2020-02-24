import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import marko from "../../../index";

export default {
  external: (id: string) => id.startsWith("marko/"),
  input: "src/index.marko",
  plugins: [
    marko({ hydrate: true }),
    nodeResolve({
      browser: true,
      extensions: [".js", ".marko"]
    }),
    commonjs({
      extensions: [".js", ".marko"]
    })
  ]
};
