import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { create } from "../../..";
const marko = create();

export default [
  {
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
  },
  {
    external: (id: string): boolean => id.startsWith("marko/"),
    plugins: [
      marko.browser({
        serialize(output) {
          return output.map((chunk) => ({
            name: chunk.name,
            type: chunk.type,
            fileName: chunk.fileName,
          }));
        },
      }),
      nodeResolve({
        browser: true,
        extensions: [".js", ".marko"],
      }),
      commonjs({
        extensions: [".js", ".marko"],
      }),
    ],
  },
];
