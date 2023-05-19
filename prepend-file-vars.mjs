import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const esmDir = path.join(fileURLToPath(new URL(".", import.meta.url)), "dist/esm");
const esmFiles = fs.readdirSync(esmDir).filter((file) => file.endsWith(".js")).map((file) => path.join(esmDir, file));
const prefix = `import { fileURLToPath } from "url";const __filename = fileURLToPath(import.meta.url);const __dirname = path.dirname(__filename);\n\n`;

for (const esmFile of esmFiles) {
  fs.writeFileSync(esmFile, prefix + fs.readFileSync(esmFile, "utf-8"));
}
