// Fails if rebuilding does not reproduce every committed output file — see docs/card.md#build
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildTo } from "./build.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outdir = path.resolve(root, "../custom_components/listapp/frontend");
const icons = path.join(root, "src/icons.generated.ts");

const jsFiles = (dir) => {
  const files = new Map();
  for (const name of readdirSync(dir).sort()) {
    files.set(name, readFileSync(path.join(dir, name)));
  }
  return files;
};

// Built into a scratch directory, never over the committed output: rebuilding in place leaves a
// file that is no longer emitted sitting in both snapshots, so it could never be detected as stale.
const fresh = mkdtempSync(path.join(tmpdir(), "listapp-card-"));
let committed;
let rebuilt;
try {
  const iconsBefore = readFileSync(icons);
  execFileSync(process.execPath, [path.join(here, "gen-icons.mjs")], { stdio: "inherit" });
  const iconsAfter = readFileSync(icons);
  await buildTo(fresh);

  committed = jsFiles(outdir);
  rebuilt = jsFiles(fresh);
  if (!iconsBefore.equals(iconsAfter)) {
    committed.set("src/icons.generated.ts", iconsBefore);
    rebuilt.set("src/icons.generated.ts", iconsAfter);
  }
} finally {
  rmSync(fresh, { recursive: true, force: true });
}

const stale = [];
for (const [name, bytes] of rebuilt) {
  const was = committed.get(name);
  if (!was) {
    stale.push(`${name} (emitted but not committed)`);
  } else if (!was.equals(bytes)) {
    stale.push(name);
  }
}
for (const name of committed.keys()) {
  if (!rebuilt.has(name)) {
    stale.push(`${name} (committed but no longer emitted)`);
  }
}

if (stale.length) {
  console.error(`Committed output is stale: ${stale.join(", ")}. Run \`npm run build\` and commit.`);
  process.exit(1);
}
console.log(`Committed output is up to date (${rebuilt.size} bundle files, generated icons).`);
