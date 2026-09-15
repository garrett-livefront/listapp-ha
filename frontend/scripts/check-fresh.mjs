// Fails if rebuilding the bundle does not reproduce the committed file — see docs/card.md#build
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const bundle = path.resolve(root, "../custom_components/listapp/frontend/listapp-list-card.js");
const icons = path.join(root, "src/icons.generated.ts");

const before = { bundle: readFileSync(bundle), icons: readFileSync(icons) };
execFileSync(process.execPath, [path.join(here, "gen-icons.mjs")], { stdio: "inherit" });
execFileSync(process.execPath, [path.join(here, "build.mjs")], { stdio: "inherit" });
const after = { bundle: readFileSync(bundle), icons: readFileSync(icons) };

const stale = Object.keys(before).filter((k) => !before[k].equals(after[k]));
if (stale.length) {
  console.error(`Committed output is stale: ${stale.join(", ")}. Run \`npm run build\` and commit.`);
  process.exit(1);
}
console.log("Committed bundle and generated icons are up to date.");
