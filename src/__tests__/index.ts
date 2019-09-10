import fs from "fs";
import path from "path";
import { rollup } from "rollup";
import css from "rollup-plugin-postcss";

const FIXTURES = path.join(__dirname, "fixtures");

fs.readdirSync(FIXTURES).forEach(fixture => {
  test(fixture, async () => {
    const dir = path.join(FIXTURES, fixture);
    const { default: config, snapshot } = await import(
      path.join(dir, "config.ts")
    );
    const bundle = await rollup({
      ...config,
      input: path.join(dir, config.input),
      plugins: [css({ extract: true }), ...config.plugins]
    });

    const generated = await bundle.generate({ dir, format: "cjs" });
    snapshot(
      (generated.output as any)
        .map(
          ({ fileName, source, code = source }) =>
            `// ${fileName}\n${code.toString("utf-8")}`
        )
        .join("\n")
    );
  });
});
