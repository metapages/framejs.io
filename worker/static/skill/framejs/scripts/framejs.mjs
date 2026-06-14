#!/usr/bin/env node
// framejs.mjs — helper for the `framejs` Agent Skill.
//
// Self-contained Node (v18+). No npm dependencies. Talks to the framejs.io API to:
//   create   read JS from stdin, create a short URL, print it, open the browser
//   fetch    retrieve the stored code/inputs/modules/og for an existing short URL
//   upload   upload a local file and print its public DataRef URL
//
// Base URL defaults to https://framejs.io; override with FRAMEJS_BASE.
//
// `create --screenshot` additionally captures a preview image of the rendered
// app and stores it as `og.image` — but ONLY when the app does not already have
// an `og.image`. Capture prefers Playwright when it can be imported (true
// network-idle waiting), and otherwise falls back to system headless Chrome
// (found via $CHROME_PATH or the usual install locations). Playwright stays an
// OPTIONAL dependency — it is loaded with a dynamic import and the script keeps
// working without it. If neither is available the URL is still printed without
// an image (the screenshot is a best-effort enhancement).
//
// Examples:
//   cat app.js | node framejs.mjs create --title "Bouncing ball" --description "A ball bouncing in the canvas" --screenshot
//   cat app.js | node framejs.mjs create --og '{"title":"...","description":"...","image":"..."}'  # preserve fetched og verbatim
//   node framejs.mjs fetch 8a3b1c...   # prints { id, hashParams: { js, inputs, modules, og } }
//   node framejs.mjs upload ./data.csv # prints { name, url, contentType }

import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execFileSync, execSync } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const BASE = (process.env.FRAMEJS_BASE || "https://framejs.io").replace(
  /\/+$/,
  "",
);

// Identifies this client (the framejs Agent Skill) to the server so usage from
// AI agents can be distinguished from web-editor traffic in analytics.
const CLIENT_TAG = "skill/1.0";

const CONTENT_TYPES = {
  ".json": "application/json",
  ".csv": "text/csv",
  ".tsv": "text/tab-separated-values",
  ".txt": "text/plain",
  ".xml": "text/xml",
  ".html": "text/html",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
};

function die(msg) {
  console.error(`framejs: ${msg}`);
  process.exit(1);
}

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on(
      "end",
      () => resolve(Buffer.concat(chunks).toString("utf8")),
    );
  });
}

function openInBrowser(url) {
  try {
    const cmd = process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "linux"
      ? `xdg-open "${url}"`
      : `cmd /c start "" "${url}"`;
    execSync(cmd, { stdio: "ignore" });
  } catch {
    // Browser open is best-effort — the printed URL is the primary output.
  }
}

// Parse `--flag value`, repeatable `--module`, and `--input name=value` pairs.
function parseFlags(argv) {
  const flags = {
    modules: [],
    inputs: {},
    open: true,
    screenshot: false,
    screenshotWait: 6000,
    screenshotSize: "1200,630",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-open") flags.open = false;
    else if (a === "--screenshot") flags.screenshot = true;
    else if (a === "--screenshot-wait") {
      flags.screenshotWait = Number(argv[++i]);
    } else if (a === "--screenshot-size") flags.screenshotSize = argv[++i];
    else if (a === "--module") flags.modules.push(argv[++i]);
    else if (a === "--title") flags.title = argv[++i];
    else if (a === "--description") flags.description = argv[++i];
    else if (a === "--og") {
      const raw = argv[++i] || "";
      try {
        flags.og = JSON.parse(raw);
      } catch {
        die(`--og expects a JSON object string, got "${raw}"`);
      }
    } else if (a === "--inputs") {
      Object.assign(flags.inputs, JSON.parse(readFileSync(argv[++i], "utf8")));
    } else if (a === "--input") {
      const pair = argv[++i] || "";
      const eq = pair.indexOf("=");
      if (eq === -1) die(`--input expects name=value, got "${pair}"`);
      const name = pair.slice(0, eq);
      const raw = pair.slice(eq + 1);
      let value;
      try {
        value = JSON.parse(raw);
      } catch {
        value = raw; // plain string
      }
      flags.inputs[name] = value;
    } else die(`unknown flag "${a}"`);
  }
  return flags;
}

async function cmdCreate(argv) {
  const flags = parseFlags(argv);
  const code = await readStdin();
  if (!code.trim()) die("no JavaScript on stdin (pipe the code into `create`)");

  const body = { js: code };
  if (flags.modules.length) body.modules = flags.modules;
  if (Object.keys(flags.inputs).length) body.inputs = flags.inputs;
  // `--og` carries a full og object through verbatim (incl. `image`) — use it
  // when MODIFYING an app to preserve the existing og without recalculating.
  // `--title`/`--description` build a fresh og and are only a fallback.
  if (flags.og !== undefined) {
    body.og = flags.og;
  } else if (flags.title || flags.description) {
    body.og = {
      title: flags.title || "",
      description: flags.description || "",
    };
  }

  let data = await shorten(body);

  // Best-effort preview image: screenshot the rendered app and store it as
  // og.image. Skipped entirely when the app already carries an og.image (e.g.
  // a fetched og passed back through --og) so we never overwrite an existing
  // image. Any failure here leaves the already-working (image-less) short URL
  // intact — the URL is the product, the image is a bonus.
  if (flags.screenshot && !body.og?.image) {
    try {
      const png = await captureScreenshot(data.shortUrl, {
        waitMs: flags.screenshotWait,
        size: flags.screenshotSize,
      });
      const imageUrl = await uploadBuffer(png, `${data.id}.png`, "image/png");
      body.og = { ...(body.og || {}), image: imageUrl };
      data = await shorten(body);
    } catch (e) {
      console.error(`framejs: screenshot skipped (${e?.message || e})`);
    }
  }

  console.log(data.shortUrl);
  if (flags.open) openInBrowser(data.shortUrl);
}

// POST a hash-param body to the shorten endpoint; returns { shortUrl, id }.
async function shorten(body) {
  const res = await fetch(`${BASE}/api/shorten/json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Framejs-Client": CLIENT_TAG,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) die(`shorten failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function cmdFetch(argv) {
  const id = (argv[0] || "").replace(/^.*\/j\//, "");
  if (!/^[0-9a-f]{64}$/i.test(id)) {
    die("fetch expects a sha256 id or /j/<sha256> URL");
  }
  const res = await fetch(`${BASE}/api/j/${id}`, {
    headers: { "X-Framejs-Client": CLIENT_TAG },
  });
  if (!res.ok) die(`fetch failed: ${res.status} ${await res.text()}`);
  console.log(JSON.stringify(await res.json(), null, 2));
}

async function cmdUpload(argv) {
  const filePath = argv[0];
  if (!filePath) die("upload expects a file path");
  const buf = readFileSync(filePath);
  const contentType = CONTENT_TYPES[extname(filePath).toLowerCase()] ||
    "application/octet-stream";
  const url = await uploadBuffer(buf, basename(filePath), contentType);
  console.log(JSON.stringify({ name: basename(filePath), url, contentType }));
}

// Presign + PUT a buffer to storage; returns its public DataRef URL.
async function uploadBuffer(buf, name, contentType) {
  const sha256 = createHash("sha256").update(buf).digest("hex");

  const presignRes = await fetch(`${BASE}/api/upload/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Framejs-Client": CLIENT_TAG,
    },
    body: JSON.stringify({ contentType, fileSize: buf.length, sha256 }),
  });
  if (!presignRes.ok) {
    die(`presign failed: ${presignRes.status} ${await presignRes.text()}`);
  }
  const { presignedUrl, canonicalPath } = await presignRes.json();

  const putRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: buf,
  });
  if (!putRes.ok) die(`upload failed: ${putRes.status} ${await putRes.text()}`);

  return `${BASE}${canonicalPath}`;
}

// Locate a Chrome/Chromium-family binary: $CHROME_PATH first, then the common
// install locations per platform, then PATH lookups. Returns null if none found.
function findChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.CHROME_BIN;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const candidates = process.platform === "darwin"
    ? [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ]
    : process.platform === "win32"
    ? [
      `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
      `${
        process.env["PROGRAMFILES(X86)"]
      }\\Google\\Chrome\\Application\\chrome.exe`,
    ]
    : [];
  for (const c of candidates) if (c && existsSync(c)) return c;

  // PATH lookup for Linux distro binaries (and as a last resort elsewhere).
  const names = [
    "google-chrome-stable",
    "google-chrome",
    "chromium",
    "chromium-browser",
    "brave-browser",
    "microsoft-edge",
  ];
  for (const name of names) {
    try {
      const resolved = execSync(
        `${process.platform === "win32" ? "where" : "command -v"} ${name}`,
        { stdio: ["ignore", "pipe", "ignore"] },
      ).toString().trim().split("\n")[0];
      if (resolved && existsSync(resolved)) return resolved;
    } catch {
      // not on PATH — try the next name
    }
  }
  return null;
}

// Capture a PNG preview of the rendered app. Prefers Playwright (proper
// network-idle waiting) when it can be loaded, falling back to system headless
// Chrome. Either path may throw; the caller treats a throw as "no image".
async function captureScreenshot(url, opts) {
  const chromium = await loadPlaywrightChromium();
  if (chromium) {
    try {
      return await captureWithPlaywright(chromium, url, opts);
    } catch (e) {
      console.error(
        `framejs: playwright capture failed (${
          e?.message || e
        }); falling back to headless Chrome`,
      );
    }
  }
  return captureWithChrome(url, opts);
}

// Try to import Playwright's `chromium` without making it a hard dependency.
// Resolves from $FRAMEJS_PLAYWRIGHT, this script, the cwd, and the npm global
// root, trying both `playwright` and `playwright-core`. Returns null if absent.
async function loadPlaywrightChromium() {
  const bases = [import.meta.url, pathToFileURL(join(process.cwd(), "x.js"))];
  if (process.env.FRAMEJS_PLAYWRIGHT) {
    bases.unshift(pathToFileURL(join(process.env.FRAMEJS_PLAYWRIGHT, "x.js")));
  }
  try {
    const globalRoot = execSync("npm root -g", {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim();
    if (globalRoot) bases.push(pathToFileURL(join(globalRoot, "x.js")));
  } catch {
    // npm not on PATH — skip the global root candidate
  }

  for (const base of bases) {
    for (const spec of ["playwright", "playwright-core"]) {
      try {
        const resolved = createRequire(base).resolve(spec);
        const mod = await import(pathToFileURL(resolved).href);
        const chromium = mod.chromium || mod.default?.chromium;
        if (chromium) return chromium;
      } catch {
        // not resolvable from this base — try the next spec/base
      }
    }
  }
  return null;
}

// Render `url` with Playwright, waiting for network idle (so async inputs
// finish loading) plus a short settle for paint, then screenshot the viewport.
// `waitMs` bounds navigation and caps the post-idle settle.
async function captureWithPlaywright(chromium, url, { waitMs, size }) {
  const [width, height] = size.split(",").map((n) => Number(n));
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: waitMs + 30000 });
    // framejs renders the app through a nested cross-origin iframe; give it a
    // brief beat after the network settles to paint/animate before capturing.
    await page.waitForTimeout(Math.min(waitMs, 2500));
    return await page.screenshot({ type: "png" });
  } finally {
    await browser.close();
  }
}

// Render `url` in system headless Chrome and return a PNG screenshot Buffer.
// `--virtual-time-budget` lets the app load/animate for ~waitMs before capture
// (framejs loads the app asynchronously through a nested cross-origin iframe).
function captureWithChrome(url, { waitMs, size }) {
  const chrome = findChrome();
  if (!chrome) {
    throw new Error(
      "no Chrome found and Playwright not installed; set CHROME_PATH, " +
        "install Chrome/Chromium, or `npm i -g playwright`",
    );
  }
  const out = join(
    tmpdir(),
    `framejs-shot-${
      createHash("sha256").update(url).digest("hex").slice(0, 16)
    }.png`,
  );
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-sandbox",
    "--force-device-scale-factor=1",
    `--window-size=${size}`,
    `--virtual-time-budget=${waitMs}`,
    `--screenshot=${out}`,
    url,
  ];
  try {
    execFileSync(chrome, args, {
      stdio: "ignore",
      timeout: waitMs + 30000,
    });
    if (!existsSync(out)) throw new Error("Chrome produced no screenshot");
    return readFileSync(out);
  } finally {
    try {
      unlinkSync(out);
    } catch {
      // temp file may not exist if Chrome failed — ignore
    }
  }
}

const [cmd, ...rest] = process.argv.slice(2);
const handlers = { create: cmdCreate, fetch: cmdFetch, upload: cmdUpload };
if (!handlers[cmd]) {
  die(
    `usage: framejs.mjs <create|fetch|upload> [...]\n  create  (reads JS from stdin)  --module <url> --input name=value --inputs <file.json> --title <t> --description <d> --og <json> --screenshot [--screenshot-wait <ms>] [--screenshot-size <w,h>] --no-open\n  fetch   <sha256 | /j/sha256>\n  upload  <file-path>`,
  );
}
handlers[cmd](rest).catch((e) => die(e?.message || String(e)));
