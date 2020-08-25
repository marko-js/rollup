import fs from "fs";
import path from "path";
import { rollup } from "rollup";
import css from "rollup-plugin-postcss";
import { toMatchFile } from "jest-file-snapshot";

const FIXTURES = path.join(__dirname, "fixtures");

expect.extend({ toMatchFile });

fs.readdirSync(FIXTURES).forEach((fixture) => {
  test(fixture, async () => {
    const dir = path.join(FIXTURES, fixture);
    const snapshotDir = path.join(dir, "__snapshots__");
    const { default: config } = await import(path.join(dir, "config.ts"));
    const bundle = await rollup({
      ...config,
      input: path.join(dir, config.input),
      plugins: [css({ extract: true }), ...config.plugins],
    });

    const generated = await bundle.generate({
      dir,
      format: "cjs",
      exports: "named",
    });
    generated.output.forEach((output) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const source = ((output as any).source || (output as any).code)
        .toString("utf-8")
        .replace(/@marko\/rollup\$\d\.\d\.\d/g, "@marko/rollup$latest");
      expect(source).toMatchFile(path.join(snapshotDir, output.fileName));
      console.log;
      // expect(code).toM
    });
  });
});
