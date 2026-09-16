// Fails if rebuilding does not reproduce every committed output file — see docs/card.md#build
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outdir = path.resolve(root, "../custom_components/listapp/frontend");
const icons = path.join(root, "src/icons.generated.ts");

const snapshot = () => {
  const files = new Map();
  for (const name of readdirSync(outdir).sort()) {
    files.set(name, readFileSync(path.join(outdir, name)));
  }
  files.set("src/icons.generated.ts", readFileSync(icons));
  return files;
};

const before = snapshot();
execFileSync(process.execPath, [path.join(here, "gen-icons.mjs")], { stdio: "inherit" });
execFileSync(process.execPath, [path.join(here, "build.mjs")], { stdio: "inherit" });
const after = snapshot();

const stale = [];
for (const [name, bytes] of after) {
  const was = before.get(name);
  if (!was) {
    stale.push(`${name} (not committed)`);
  } else if (!was.equals(bytes)) {
    stale.push(name);
  }
}
for (const name of before.keys()) {
  if (!after.has(name)) {
    stale.push(`${name} (committed but no longer emitted)`);
  }
}

if (stale.length) {
  console.error(`Committed output is stale: ${stale.join(", ")}. Run \`npm run build\` and commit.`);
  process.exit(1);
}
console.log(`Committed output is up to date (${after.size - 1} bundle files, generated icons).`);
