import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as esbuild from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outfile = path.resolve(root, "../custom_components/listapp/frontend/listapp-list-card.js");
const litVersion = JSON.parse(readFileSync(path.join(root, "node_modules/lit/package.json"), "utf8")).version;

const banner = [
  "/*!",
  " * listapp-list-card — ListApp list card for Home Assistant.",
  " * Source and licences: https://github.com/garrett-livefront/listapp-ha (frontend/, NOTICE)",
  ` * Bundles lit ${litVersion} (BSD-3-Clause) and icon paths from lucide (ISC).`,
  " */",
].join("\n");

export const options = {
  entryPoints: [path.join(root, "src/listapp-list-card.ts")],
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  legalComments: "none",
  sourcemap: false,
  banner: { js: banner },
  logLevel: "info",
  define: { "process.env.NODE_ENV": '"production"' },
};

const serve = process.argv.includes("--serve");

if (serve) {
  const ctx = await esbuild.context({
    ...options,
    minify: false,
    outfile: path.join(root, "dev/dist/listapp-list-card.js"),
  });
  await ctx.watch();
  const { hosts, port } = await ctx.serve({ servedir: path.join(root, "dev") });
  console.log(`harness: http://${hosts[0]}:${port}/`);
} else {
  await esbuild.build({ ...options, outfile });
}
