import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import marko from "../../../html-target";

export default {
  external: (id: string): boolean => id.startsWith("marko/"),
  input: "src/index.js",
  plugins: [
    marko({
      browser: {
        external: (id: string): boolean => id.startsWith("marko/"),
        plugins: [
          nodeResolve({
            browser: true,
            extensions: [".js", ".marko"],
          }),
          commonjs({
            extensions: [".js", ".marko"],
            include: ["node_modules/**", "**/*.marko", "**/*.js"],
          }),
        ]
      }
    }),
    nodeResolve({
      extensions: [".js", ".marko"],
    }),
    commonjs({
      extensions: [".js", ".marko"],
      include: ["node_modules/**", "**/*.marko", "**/*.js"],
    }),
  ],
};
