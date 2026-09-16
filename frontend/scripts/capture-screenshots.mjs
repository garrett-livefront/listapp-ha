#!/usr/bin/env node
// Captures README screenshots from the dev harness via CDP. See CONTRIBUTING.md#readme-screenshots.
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
// `npm run dev` (esbuild's ctx.serve) picks another port if 8000 is taken; override with
// HARNESS_URL if yours did.
const HARNESS_URL = process.env.HARNESS_URL || "http://127.0.0.1:8000/";
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
    const cleanup = () => {
      ws.removeEventListener("message", onMessage);
      ws.removeEventListener("close", onClose);
      ws.removeEventListener("error", onClose);
    };
    const onMessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === id) {
        cleanup();
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
    // Without this, a closed/crashed socket leaves the promise pending forever —
    // `waitFor`'s timeout can't help because it's waiting on this same promise.
    const onClose = () => {
      cleanup();
      reject(new Error(`CDP connection closed while waiting for ${method}`));
    };
    ws.addEventListener("message", onMessage);
    ws.addEventListener("close", onClose);
    ws.addEventListener("error", onClose);
  });
}

// Wait for one CDP event (e.g. "Page.loadEventFired"), so navigation is only considered
// done once the new document has actually loaded, not just once Page.navigate acknowledges.
async function cdpEvent(ws, method, { timeoutMs = 10_000 } = {}) {
  const event = new Promise((resolve) => {
    const onMessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === method) {
        ws.removeEventListener("message", onMessage);
        resolve(msg.params);
      }
    };
    ws.addEventListener("message", onMessage);
  });
  const timeout = sleep(timeoutMs).then(() => {
    throw new Error(`timed out waiting for ${method}`);
  });
  return Promise.race([event, timeout]);
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
    // Port 0: Chrome picks an ephemeral port and writes it to DevToolsActivePort in the
    // profile dir, so this script only ever talks to the instance it just spawned — a
    // fixed port could otherwise land on an unrelated already-listening browser.
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--disable-gpu",
  ]);

  try {
    const port = await waitFor(async () => {
      const contents = await readFile(join(userDataDir, "DevToolsActivePort"), "utf8");
      const [portLine] = contents.split("\n");
      return portLine ? Number(portLine) : null;
    });
    // `npm run dev &` and this script are started back to back; wait for the harness
    // itself to answer before opening a tab on it, not just for Chrome's CDP port.
    await waitFor(async () => {
      const res = await fetch(HARNESS_URL);
      return res.ok;
    });
    const target = await waitFor(async () => {
      const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
      return res.ok ? res.json() : null;
    });
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener("open", resolve));
    await cdp(ws, "Page.enable");

    for (const shot of SHOTS) {
      await cdp(ws, "Emulation.clearDeviceMetricsOverride");
      const url = `${HARNESS_URL}?scenario=${shot.scenario}&width=380`;
      const loaded = cdpEvent(ws, "Page.loadEventFired");
      await cdp(ws, "Page.navigate", { url });
      // Wait for the new document's load event, not just the harness's own render — this
      // is what stops a later scenario's screenshot from reusing the previous document,
      // which navigation alone doesn't guarantee has been replaced yet.
      await loaded;

      // Wait for the harness to actually render both theme columns for this scenario.
      // Scoped to `main`: `#editorRoot` also carries class="theme light" (hidden) for the
      // editor preview panel, so an unscoped selector always overcounts by one.
      await waitFor(async () => {
        const { result } = await cdp(ws, "Runtime.evaluate", {
          expression: "document.querySelectorAll('main .theme.light, main .theme.dark').length === 2",
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
          expression: `(() => { const r = document.querySelector("main .theme.${theme}").getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`,
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
    // Register the exit listener before killing — if Chrome already exited (e.g. it
    // crashed), the promise resolves immediately from `exitCode`/`signalCode` instead of
    // waiting on an "exit" event that already fired.
    const exited =
      chrome.exitCode !== null || chrome.signalCode !== null
        ? Promise.resolve()
        : new Promise((resolve) => chrome.once("exit", resolve));
    chrome.kill();
    await exited;
    // Best-effort: Chrome can still hold a lock file open for a moment after exit.
    await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
