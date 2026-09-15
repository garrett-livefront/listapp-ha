#!/usr/bin/env node
// Captures README screenshots from the dev harness via CDP. See CONTRIBUTING.md#readme-screenshots.
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const HARNESS_URL = "http://127.0.0.1:8000/";
const OUT_DIR = new URL("../../docs/images/", import.meta.url);

const SHOTS = [
  { scenario: 0, name: "default" },
  { scenario: 1, name: "colored-icon" },
  { scenario: 2, name: "empty" },
  { scenario: 6, name: "unavailable-reauth" },
  { scenario: 5, name: "viewer" },
  { scenario: 8, name: "collapse" },
];

async function cdp(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1e9);
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const handler = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === id) {
        ws.removeEventListener("message", handler);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
    ws.addEventListener("message", handler);
  });
}

// Retry a check until it succeeds or the timeout elapses — used for both the CDP
// endpoint and the harness's own render, neither of which have a fixed startup time.
async function waitFor(check, { timeoutMs = 10_000, intervalMs = 150 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const result = await check();
      if (result) return result;
    } catch {
      // not ready yet
    }
    if (Date.now() > deadline) throw new Error(`timed out waiting after ${timeoutMs}ms`);
    await sleep(intervalMs);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // An isolated profile dir: Chrome disables --remote-debugging-port on the default
  // profile, and reusing it would also collide with any already-open Chrome.
  const userDataDir = await mkdtemp(join(tmpdir(), "listapp-card-capture-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--disable-gpu",
  ]);

  try {
    const target = await waitFor(async () => {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${HARNESS_URL}`, { method: "PUT" });
      return res.ok ? res.json() : null;
    });
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener("open", resolve));
    await cdp(ws, "Page.enable");

    for (const shot of SHOTS) {
      await cdp(ws, "Emulation.clearDeviceMetricsOverride");
      const url = `${HARNESS_URL}?scenario=${shot.scenario}&width=380`;
      await cdp(ws, "Page.navigate", { url });

      // Wait for the harness to actually render both theme columns for this scenario,
      // rather than a fixed delay — a cold dev-server or bundle rebuild is slower than any
      // fixed sleep would reliably cover.
      await waitFor(async () => {
        const { result } = await cdp(ws, "Runtime.evaluate", {
          expression: "document.querySelectorAll('.theme.light, .theme.dark').length === 2",
          returnByValue: true,
        });
        return result.value;
      });

      // Hide the harness chrome and per-scenario debug labels; not part of the shipped card.
      await cdp(ws, "Runtime.evaluate", {
        expression: `
          document.querySelector(".bar").style.display = "none";
          document.querySelectorAll(".scenario h4, .scenario pre").forEach((el) => el.style.display = "none");
          document.querySelector("main").scrollHeight;
        `,
      });
      await sleep(400);

      // Measure the full page (both theme columns) so the device viewport covers both
      // before clipping each column out individually below.
      const { result } = await cdp(ws, "Runtime.evaluate", {
        expression: "({w: document.documentElement.scrollWidth, h: document.querySelector('main').scrollHeight})",
        returnByValue: true,
      });
      const { w, h } = result.value;

      await cdp(ws, "Emulation.setDeviceMetricsOverride", {
        width: w,
        height: h,
        deviceScaleFactor: 2,
        mobile: false,
      });
      await sleep(200);

      // The harness renders `.theme.light` and `.theme.dark` side by side in one `main`
      // (see harness.js render()); clip each column out of the same page separately.
      for (const theme of ["light", "dark"]) {
        const { result: rectResult } = await cdp(ws, "Runtime.evaluate", {
          expression: `(() => { const r = document.querySelector(".theme.${theme}").getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`,
          returnByValue: true,
        });
        const clip = { ...rectResult.value, scale: 1 };

        const { data } = await cdp(ws, "Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          clip,
        });

        const outPath = new URL(`card-${shot.name}-${theme}.png`, OUT_DIR);
        await writeFile(outPath, Buffer.from(data, "base64"));
        console.log(`wrote ${outPath.pathname}`);
      }
    }

    ws.close();
  } finally {
    chrome.kill();
    await new Promise((resolve) => chrome.once("exit", resolve));
    // Best-effort: Chrome can still hold a lock file open for a moment after exit.
    await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
