#!/usr/bin/env node
// Captures README screenshots from the dev harness via CDP. See CONTRIBUTING.md#screenshots.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
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

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const chrome = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--disable-gpu",
  ]);
  await sleep(1500);

  try {
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${HARNESS_URL}`, { method: "PUT" })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener("open", resolve));
    await cdp(ws, "Page.enable");

    for (const shot of SHOTS) {
      await cdp(ws, "Emulation.clearDeviceMetricsOverride");
      const url = `${HARNESS_URL}?scenario=${shot.scenario}&width=380`;
      await cdp(ws, "Page.navigate", { url });
      await sleep(600);

      // Hide the harness chrome and per-scenario debug labels; not part of the shipped card.
      await cdp(ws, "Runtime.evaluate", {
        expression: `
          document.querySelector(".bar").style.display = "none";
          document.querySelectorAll(".scenario h4, .scenario pre").forEach((el) => el.style.display = "none");
          document.querySelector("main").scrollHeight;
        `,
      });
      await sleep(400);

      // Measure `main` itself, not documentElement — an empty-viewport body can inflate scrollHeight.
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

      const { data } = await cdp(ws, "Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: w, height: h, scale: 1 },
      });

      const outPath = new URL(`card-${shot.name}.png`, OUT_DIR);
      await writeFile(outPath, Buffer.from(data, "base64"));
      console.log(`wrote ${outPath.pathname}`);
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
