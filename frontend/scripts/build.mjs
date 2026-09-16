import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as esbuild from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outdir = path.resolve(root, "../custom_components/listapp/frontend");
const litVersion = JSON.parse(readFileSync(path.join(root, "node_modules/lit/package.json"), "utf8")).version;

export const ENTRY_FILENAME = "listapp-list-card.js";
export const IMPL_FILENAME = "listapp-list-card-impl.js";

// The entry must stay small enough to define the tags inside HA's 2s deadline —
// see docs/card.md#fast-registration
const ENTRY_MAX_BYTES = 8 * 1024;

const credit = [
  "/*!",
  " * listapp-list-card — ListApp list card for Home Assistant.",
  " * Source and licences: https://github.com/garrett-livefront/listapp-ha (frontend/, NOTICE)",
];

const entryBanner = [...credit, " */"].join("\n");
const implBanner = [
  ...credit,
  ` * Bundles lit ${litVersion} (BSD-3-Clause) and icon paths from lucide (ISC).`,
  " */",
].join("\n");

const shared = {
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  legalComments: "none",
  sourcemap: false,
  logLevel: "info",
  define: { "process.env.NODE_ENV": '"production"' },
};

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex").slice(0, 12);

function assertEntryIsLazy(file) {
  const text = readFileSync(file, "utf8");
  const bytes = statSync(file).size;
  if (/(?:import|from)\s*["'][^"']*listapp-list-card-impl/.test(text)) {
    throw new Error(`${ENTRY_FILENAME} statically imports the implementation; it must be dynamic.`);
  }
  if (!text.includes("import(")) {
    throw new Error(`${ENTRY_FILENAME} has no dynamic import; the implementation would never load.`);
  }
  if (bytes > ENTRY_MAX_BYTES) {
    throw new Error(`${ENTRY_FILENAME} is ${bytes} bytes, over the ${ENTRY_MAX_BYTES} byte budget.`);
  }
  return bytes;
}

// The impl builds first so the entry can embed its content hash as a cache-busting query.
export async function buildTo(dir, { minify = true, implQuery = true } = {}) {
  mkdirSync(dir, { recursive: true });
  await esbuild.build({
    ...shared,
    minify,
    entryPoints: [path.join(root, "src/listapp-list-card.ts")],
    outfile: path.join(dir, IMPL_FILENAME),
    banner: { js: implBanner },
  });

  const implUrl = implQuery
    ? `./${IMPL_FILENAME}?v=${hash(readFileSync(path.join(dir, IMPL_FILENAME)))}`
    : `./${IMPL_FILENAME}`;

  await esbuild.build({
    ...shared,
    minify,
    entryPoints: [path.join(root, "src/entry.ts")],
    outfile: path.join(dir, ENTRY_FILENAME),
    banner: { js: entryBanner },
    define: { ...shared.define, __IMPL_URL__: JSON.stringify(implUrl) },
  });

  return assertEntryIsLazy(path.join(dir, ENTRY_FILENAME));
}

export const emittedFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith(".js")).sort();

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const serve = process.argv.includes("--serve");
  if (serve) {
    const dir = path.join(root, "dev/dist");
    mkdirSync(dir, { recursive: true });
    const implCtx = await esbuild.context({
      ...shared,
      minify: false,
      entryPoints: [path.join(root, "src/listapp-list-card.ts")],
      outfile: path.join(dir, IMPL_FILENAME),
      banner: { js: implBanner },
    });
    const ctx = await esbuild.context({
      ...shared,
      minify: false,
      entryPoints: [path.join(root, "src/entry.ts")],
      outfile: path.join(dir, ENTRY_FILENAME),
      banner: { js: entryBanner },
      define: { ...shared.define, __IMPL_URL__: JSON.stringify(`./${IMPL_FILENAME}`) },
    });
    await implCtx.watch();
    await ctx.watch();
    const { hosts, port } = await ctx.serve({ servedir: path.join(root, "dev") });
    console.log(`harness: http://${hosts[0]}:${port}/`);
  } else {
    const bytes = await buildTo(outdir);
    console.log(`entry ${ENTRY_FILENAME}: ${bytes} bytes (budget ${ENTRY_MAX_BYTES})`);
  }
}
