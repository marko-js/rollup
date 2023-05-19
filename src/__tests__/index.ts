import fs from "fs";
import path from "path";
import * as rollup from "rollup";
import css from "rollup-plugin-postcss";
import { toMatchFile } from "jest-file-snapshot";
import ".."; // Ensure jest watches changes to the plugin.

const FIXTURES = path.join(__dirname, "fixtures");

expect.extend({ toMatchFile });

fs.readdirSync(FIXTURES).forEach((fixture) => {
  test(`${fixture}`, async () => {
    const dir = path.join(FIXTURES, fixture);
    const configs = (await import(path.join(dir, "config.ts"))).default as
      | rollup.RollupOptions
      | rollup.RollupOptions[];

    if (Array.isArray(configs)) {
      let i = 0;
      const generated: rollup.RollupOutput[] = [];
      for (const config of configs) {
        generated.push(await generate(config));
      }

      for (const output of generated) {
        snapshot(
          output,
          path.join(
            dir,
            "__snapshots__",
            generated.length === 2 ? (i === 0 ? "server" : "browser") : `${i}`
          )
        );
        i++;
      }
    } else {
      snapshot(await generate(configs), path.join(dir, "__snapshots__"));
    }

    async function generate(config: rollup.RollupOptions) {
      const bundle = await rollup.rollup({
        ...config,
        input:
          typeof config.input === "string"
            ? path.join(dir, config.input)
            : undefined,
        plugins: [css({ extract: true })].concat((config.plugins as any) || []),
      });

      return await bundle.generate({ dir });
    }

    function snapshot({ output }: rollup.RollupOutput, snapshotDir: string) {
      output.forEach((chunk) => {
        expect(
          (chunk.type === "chunk" ? chunk.code : chunk.source)
            .toString()
            .replace(/@marko\/rollup\$\d\.\d\.\d/g, "@marko/rollup$latest")
        ).toMatchFile(path.join(snapshotDir, chunk.fileName));
      });
    }
  });
});
