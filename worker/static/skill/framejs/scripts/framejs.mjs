#!/usr/bin/env node
// framejs.mjs — helper for the `framejs` Agent Skill.
//
// Self-contained Node (v18+). No npm dependencies. Two backends:
//   framejs.app  — the account/frame layer. A frame lives at a stable
//                  /j/<uuid> URL whose content is mutable: every update POSTs
//                  the hash params to /j/<uuid>.json and appends a version.
//   framejs.io   — the runtime that actually renders the app from hash params,
//                  plus file uploads (presign) and screenshot rendering.
//
// Commands:
//   create   read JS from stdin, create-or-update the session's framejs.app
//            frame, print its /j/<uuid> page URL + an immutable /j/<sha256>
//            snapshot URL. Reuses the frame recorded in --state so repeated calls
//            update the SAME frame; --new starts a fresh one. Opens the
//            browser only the first time a frame is minted (not for --id, and
//            not for a repeat --state) — updates reach the same already-open
//            tab via its live-update subscription, so it isn't reopened. Mints
//            an API token for a new frame and stores it in --state, sending it
//            as a bearer credential so updates keep working after a user claims
//            the frame (a claimed frame rejects anonymous writes otherwise).
//            --id accepts a full framejs URL (either backend); a `?token=<key>`
//            on it (from the app's "Copy frame for AI session") is stored and
//            sent as the bearer credential so updates survive the frame being
//            claimed. --token <key> sets it explicitly. When --id is a full URL
//            its origin becomes the target backend (so a dev/self-hosted frame
//            URL updates its own stack); --app-origin / --io-origin override
//            explicitly.
//   fetch    retrieve the stored hash params (js/inputs/modules/og) for a
//            framejs.app /j/<uuid> frame (or a legacy framejs.io /j/<sha256>).
//   upload   upload a local file and print its public DataRef URL.
//
// Origins (override for local dev via env or a nearby .env — see loadDotEnv):
//   FRAMEJS_APP_ORIGIN  framejs.app layer   (default https://framejs.app)
//   FRAMEJS_IO_ORIGIN   framejs.io runtime  (default https://framejs.io;
//                       FRAMEJS_BASE is accepted as a legacy alias)
// Per-run overrides (win over the env baseline): the --app-origin/--io-origin
// flags, or the origin of a full frame URL passed to --id / fetch — so a dev
// frame URL like https://framejs-app.localhost:13747/j/<uuid>?token=<key> drives
// its own backend with no env preconfigured (see resolveOrigins).
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
//   cat app.js | node framejs.mjs create --state "$SCRATCH/frame.json" --title "Bouncing ball" --description "A ball bouncing in the canvas" --screenshot
//   cat app.js | node framejs.mjs create --state "$SCRATCH/frame.json"            # updates the same frame recorded in --state
//   cat app.js | node framejs.mjs create --state "$SCRATCH/frame.json" --new      # start a different frame in the same session
//   cat app.js | node framejs.mjs create --id 0192f0a1-....  --og '{"title":"...","image":"..."}'  # update a specific frame, preserving fetched og
//   node framejs.mjs fetch 0192f0a1...  # framejs.app frame → prints { js, inputs, modules, og }
//   node framejs.mjs upload ./data.csv  # prints { name, url, contentType }

import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash, randomBytes } from "node:crypto";
import { execFileSync, execSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// Load a nearby .env (walking up from the cwd and from this script) so that,
// when the skill runs inside a local dev checkout, the *_ORIGIN overrides point
// at the dev stack automatically. Never overrides a var already in the
// environment. Silent no-op when no .env is found (the normal end-user case, so
// origins fall back to production).
function loadDotEnv() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const seen = new Set();
  for (const start of [process.cwd(), scriptDir]) {
    let dir = resolve(start);
    while (true) {
      const candidate = join(dir, ".env");
      if (!seen.has(candidate) && existsSync(candidate)) {
        seen.add(candidate);
        for (const line of readFileSync(candidate, "utf8").split("\n")) {
          const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
          if (!m || line.trimStart().startsWith("#")) continue;
          const key = m[1];
          let val = m[2].trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) process.env[key] = val;
        }
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
}
loadDotEnv();

const stripSlash = (u) => u.replace(/\/+$/, "");

// framejs.app: the account/frame layer that owns the mutable /j/<uuid> content.
// framejs.io: the runtime (rendering, uploads, screenshots, legacy sha256 read).
// These are the baseline (env/.env → production default). Each command may
// narrow them for its run — an explicit --app-origin/--io-origin flag, or the
// origin carried on a full frame URL passed to --id/fetch — so a dev or
// self-hosted frame (e.g. https://framejs-app.localhost:13747/j/<uuid>?token=…)
// targets its own backend without any env preconfigured. See resolveOrigins().
let APP_ORIGIN = stripSlash(
  process.env.FRAMEJS_APP_ORIGIN || "https://framejs.app",
);
let IO_ORIGIN = stripSlash(
  process.env.FRAMEJS_IO_ORIGIN || process.env.FRAMEJS_BASE ||
    "https://framejs.io",
);

// This skill's own version, read from the sibling SKILL.md frontmatter it
// shipped with (this script lives at <skill>/scripts/, so SKILL.md is one dir
// up). Drives both the analytics client tag and the update check. Null if it
// can't be read — neither is load-bearing.
function readOwnVersion() {
  try {
    const skillMd = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "..", "SKILL.md"),
      "utf8",
    );
    const fm = (skillMd.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
    return (fm.match(/^\s*version:\s*"?([^"\n]+?)"?\s*$/m) || [])[1] || null;
  } catch {
    return null;
  }
}
const OWN_VERSION = readOwnVersion();

// Identifies this client (the framejs Agent Skill) and its version to the server
// so usage from AI agents can be distinguished from web-editor traffic in
// analytics, and so version adoption is visible. analytics.ts keys off the
// "skill" prefix, so any "skill/<v>" is recognized.
const CLIENT_TAG = `skill/${OWN_VERSION || "unknown"}`;

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
    new: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-open") flags.open = false;
    else if (a === "--new") flags.new = true;
    else if (a === "--id") flags.id = argv[++i];
    else if (a === "--token") flags.token = argv[++i];
    else if (a === "--app-origin") flags.appOrigin = argv[++i];
    else if (a === "--io-origin") flags.ioOrigin = argv[++i];
    else if (a === "--state") flags.state = argv[++i];
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

// A time-ordered UUID (v7): 48-bit ms timestamp + 74 random bits. Client-side
// generated so a frame's URL exists before the first POST, and so successive
// frames sort by creation time.
function uuidv7() {
  const ts = Date.now();
  const b = randomBytes(16);
  // 48-bit big-endian timestamp in bytes 0..5.
  b[0] = Math.floor(ts / 2 ** 40) & 0xff;
  b[1] = Math.floor(ts / 2 ** 32) & 0xff;
  b[2] = Math.floor(ts / 2 ** 24) & 0xff;
  b[3] = Math.floor(ts / 2 ** 16) & 0xff;
  b[4] = Math.floor(ts / 2 ** 8) & 0xff;
  b[5] = ts & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70; // version 7
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${
    h.slice(16, 20)
  }-${h.slice(20)}`;
}

// The /j/<slug> path carries the uuid without dashes (matches lib/frame.ts).
const frameSlug = (uuid) => uuid.replaceAll("-", "");

// Parse a frame reference the user/agent may hand us: a bare id, a slug, or a
// full framejs URL — from either backend, with or without a `?token=<key>` query
// param (as produced by the app's "Copy frame for AI session" action). Returns
// { id, token, origin }: `id` is the frame id (dashes preserved; frameSlug
// strips them), `token` the API bearer key if the URL carried one (undefined
// otherwise), and `origin` the scheme://host[:port] when a full URL was given —
// so a dev/self-hosted frame URL can target its own backend (undefined for a
// bare id/slug).
function parseFrameRef(raw) {
  let s = String(raw || "").trim();
  let token;
  const q = s.indexOf("?");
  if (q >= 0) {
    try {
      token = new URLSearchParams(s.slice(q + 1)).get("token") || undefined;
    } catch { /* not parseable — ignore the query string */ }
    s = s.slice(0, q);
  }
  // Capture the origin when a full URL was given (anything before `/j/`), so an
  // update/read can go to the same backend the URL names — no env needed.
  const originMatch = s.match(/^(https?:\/\/[^/]+)\/j\//i);
  const origin = originMatch ? stripSlash(originMatch[1]) : undefined;
  // Drop any leading origin/.../j/ and a trailing .json, leaving just the id.
  const id = s.replace(/^.*\/j\//, "").replace(/\.json$/, "").trim();
  return { id, token, origin };
}

// Encode one JSON-blob value the way framejs hash params are stored: the exact
// inverse of the server's unpack (base64(encodeURIComponent(JSON.stringify(v)))).
// Used for structured keys (`inputs`, `modules`, `og`).
const packHashParamValue = (v) =>
  Buffer.from(encodeURIComponent(JSON.stringify(v)), "utf8").toString("base64");

// `js` is a raw string param, not a JSON blob — the client reads it via
// @metapages/hash-query's plain base64/URI decode (no JSON.parse), so encoding
// it with packHashParamValue corrupts it (quoted/escaped code, and a `%` in the
// source trips the client's legacy double-decode fallback into a URIError).
const packRawStringHashParamValue = (v) =>
  Buffer.from(encodeURIComponent(v), "utf8").toString("base64");

// A self-contained framejs.io URL that renders `body` with no account/login —
// handy for quick viewing and as the screenshot target.
function runtimeUrl(body) {
  const segments = Object.entries(body)
    .map(([k, v]) =>
      `${k}=${
        k === "js" && typeof v === "string"
          ? packRawStringHashParamValue(v)
          : packHashParamValue(v)
      }`
    );
  return `${IO_ORIGIN}/#?${segments.join("&")}`;
}

// Per-session record of which frame the skill is editing. Resolved from --state
// or $FRAMEJS_STATE; falls back to a shared temp file (SKILL.md instructs the
// agent to pass a scratchpad path so sessions don't collide).
function stateFile(flags) {
  return flags.state || process.env.FRAMEJS_STATE ||
    join(tmpdir(), "framejs-skill", "frame.json");
}
function readState(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}
function writeState(path, data) {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(data, null, 2));
  } catch {
    // Non-fatal: state is a convenience; --id keeps working without it.
  }
}

// First `--name value` occurrence in argv, else undefined. Used by commands
// (like `fetch`) that don't route through parseFlags but still accept origins.
function flagValue(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

// Is `origin` the runtime (framejs.io) layer rather than the account/app layer?
// A frame URL's origin can name EITHER layer: the app's "Copy frame for AI
// session" action emits a runtime URL — https://framejs.io/j/<uuid>?token=… —
// while the /j/<uuid> page URL and dev/self-hosted URLs name the app layer.
// Frame POSTs (create/update, token mint) only work on the app layer, so a
// runtime origin must NOT be used as APP_ORIGIN (that 404s the POST). Matches
// the configured io baseline and production framejs.io (any scheme/port).
function isRuntimeOrigin(origin) {
  const o = stripSlash(String(origin)).toLowerCase();
  if (o === stripSlash(IO_ORIGIN).toLowerCase()) return true;
  try {
    return new URL(o).hostname === "framejs.io";
  } catch {
    return false;
  }
}

// Given a runtime origin, the paired account/app origin that accepts frame
// POSTs. An explicit FRAMEJS_APP_ORIGIN (already in APP_ORIGIN) wins; otherwise
// the production runtime framejs.io pairs with framejs.app. Returns undefined
// when no pairing is known, in which case APP_ORIGIN keeps its env/default
// baseline (framejs.app) — the correct account layer for production.
function pairedAppOrigin(runtimeOrigin) {
  if (process.env.FRAMEJS_APP_ORIGIN) return stripSlash(APP_ORIGIN);
  try {
    if (new URL(stripSlash(String(runtimeOrigin))).hostname === "framejs.io") {
      return "https://framejs.app";
    }
  } catch { /* unparseable — fall through */ }
  return undefined;
}

// Narrow the backend origins for this run, most specific first:
//   explicit --app-origin/--io-origin flag
//   > origin carried on a full frame URL (--id / the fetch arg)
//   > origin recorded in --state for a reused session frame
//   > the env/.env/production baseline already in APP_ORIGIN / IO_ORIGIN.
// A full frame URL's origin is split by layer: an app-layer origin (framejs.app,
// framejs-app.localhost, a self-hosted app host) becomes APP_ORIGIN, while a
// runtime-layer origin (framejs.io — e.g. the "Copy frame for AI session" URL)
// becomes IO_ORIGIN and maps APP_ORIGIN to its paired app layer. This lets a
// dev/self-hosted frame URL (e.g. https://framejs-app.localhost:13747/j/<uuid>)
// drive its own stack, keeps a session's repeated in-place updates on the same
// backend, and — critically — routes a runtime frame URL's POST to the app layer
// that actually accepts it instead of 404ing against the runtime.
function resolveOrigins(
  { flagApp, flagIo, urlOrigin, stateApp, stateIo } = {},
) {
  const urlIsRuntime = urlOrigin && isRuntimeOrigin(urlOrigin);
  if (flagApp) APP_ORIGIN = stripSlash(flagApp);
  else if (urlIsRuntime) {
    const paired = pairedAppOrigin(urlOrigin);
    if (paired) APP_ORIGIN = paired; // else keep the env/default app baseline
  } else if (urlOrigin) APP_ORIGIN = stripSlash(urlOrigin);
  else if (stateApp) APP_ORIGIN = stripSlash(stateApp);
  if (flagIo) IO_ORIGIN = stripSlash(flagIo);
  else if (urlIsRuntime) IO_ORIGIN = stripSlash(urlOrigin);
  else if (stateIo) IO_ORIGIN = stripSlash(stateIo);
}

async function cmdCreate(argv) {
  const flags = parseFlags(argv);
  const code = await readStdin();
  if (!code.trim()) die("no JavaScript on stdin (pipe the code into `create`)");

  const body = { js: code };
  if (flags.modules.length) body.modules = flags.modules;
  if (Object.keys(flags.inputs).length) body.inputs = flags.inputs;
  // Resolve the target frame first (so we can preserve its stored OG on an
  // in-place update): an explicit --id (which may be a full URL, possibly
  // carrying ?token=) wins; otherwise reuse the frame recorded in --state
  // (unless --new), and mint a fresh uuid when there's none.
  const statePath = stateFile(flags);
  const state = readState(statePath);
  const ref = flags.id ? parseFrameRef(flags.id) : null;
  // Resolve the effective backend origins before any network call below (the OG
  // fetch, screenshot upload, POST, token mint and snapshot all read them).
  resolveOrigins({
    flagApp: flags.appOrigin,
    flagIo: flags.ioOrigin,
    urlOrigin: ref?.origin,
    stateApp: state.appOrigin,
    stateIo: state.ioOrigin,
  });
  const uuid = ref?.id || (!flags.new && state.uuid) || uuidv7();
  const slug = frameSlug(uuid);
  // Only a freshly minted uuid (no --id, and not already the session's known
  // frame) has never been opened anywhere — an update to an existing frame
  // reaches the same already-open tab via the page's live-update subscription,
  // so opening again would just spawn a redundant new tab.
  const isNewFrame = !flags.id && uuid !== state.uuid;

  // Open Graph, most-specific first:
  // • `--og` carries a full og object through verbatim (incl. `image`).
  // • `--title`/`--description` build a fresh og.
  // • otherwise, when UPDATING an existing frame, carry its stored og forward —
  //   so a bare re-run (the one-frame-per-session update pattern) never silently
  //   drops the title/description, and the retained `og.image` also skips the
  //   redundant re-screenshot below. Best-effort: a fresh frame has none.
  if (flags.og !== undefined) {
    body.og = flags.og;
  } else if (flags.title || flags.description) {
    body.og = {
      title: flags.title || "",
      description: flags.description || "",
    };
  } else if (!isNewFrame) {
    const storedOg = await fetchStoredOg(slug);
    if (storedOg) body.og = storedOg;
  }

  // Best-effort preview image BEFORE the POST so a single version carries it.
  // Rendered from the self-contained framejs.io run URL (the /j/<uuid> page is
  // login-gated). Skipped when the app already has an og.image so a fetched og
  // passed back through --og is never overwritten.
  if (flags.screenshot && !body.og?.image) {
    try {
      const png = await captureScreenshot(runtimeUrl(body), {
        waitMs: flags.screenshotWait,
        size: flags.screenshotSize,
      });
      const imageUrl = await uploadBuffer(png, `${slug}.png`, "image/png");
      body.og = { ...(body.og || {}), image: imageUrl };
    } catch (e) {
      console.error(`framejs: screenshot skipped (${e?.message || e})`);
    }
  }

  // Resolve the auth token, most-specific first: one supplied on the URL/flag
  // (the "Copy frame for AI session" capability URL) wins, else the one recorded
  // for this same frame in --state, else none yet. (A different frame's token
  // must never be reused.)
  let token = ref?.token || flags.token ||
    (state.uuid === uuid ? state.token : undefined);

  await postFrame(slug, body, token);

  // Mint a token the first time we touch a frame so updates keep working after a
  // user claims it. Best-effort: only possible while the frame is still
  // ownerless, which it is right after a fresh create. Skipped when we already
  // have a token (e.g. from a capability URL). Persist it in --state.
  if (!token) {
    token = await mintToken(slug);
  }
  writeState(statePath, {
    uuid,
    token,
    appOrigin: APP_ORIGIN,
    ioOrigin: IO_ORIGIN,
  });

  const pageUrl = `${APP_ORIGIN}/j/${slug}`;
  // Immutable content-addressed snapshot of exactly what we just posted (best
  // effort — undefined if the runtime has no shortener configured).
  const snapshotUrl = await shortenSnapshot(body);

  // Line 1 is the primary framejs.app page URL (account layer + live updates);
  // `snapshot:` is the immutable /j/<sha256> copy.
  console.log(pageUrl);
  if (snapshotUrl) console.log(`snapshot: ${snapshotUrl}`);

  // Lifecycle caveats — advisory, so emitted to stderr like the update notice.
  // Relay them so the user understands how long each URL lasts and which to keep.
  console.error(
    "framejs: share-link lifecycle (please relay to the user):\n" +
      `         • ${pageUrl}\n` +
      "           Editable, live-updating page. An anonymous (unclaimed) frame is\n" +
      "           temporary and WILL EXPIRE — the user should open it and claim it\n" +
      "           (needs a free account) to keep it permanently.\n" +
      (snapshotUrl
        ? `         • ${snapshotUrl}\n` +
          "           An IMMUTABLE snapshot of the current app that EXPIRES ~30 days\n" +
          "           after it is last opened. Good for a stable share/backup link;\n" +
          "           it never reflects later edits.\n"
        : ""),
  );
  if (flags.open && isNewFrame) openInBrowser(pageUrl);
}

// POST the hash-param body to framejs.app /j/<slug>.json — creates the frame on
// first call, appends a version on every later call. Returns the unpacked dict.
// `token`, if given, is sent as an `Authorization: Bearer` credential so updates
// keep working after the frame is claimed by a user (see mintToken).
async function postFrame(slug, body, token) {
  const res = await fetch(`${APP_ORIGIN}/j/${slug}.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Framejs-Client": CLIENT_TAG,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (res.status === 403) {
    // The frame has an owner and our credential didn't authorize the write —
    // either it was never minted (anonymous frame later claimed) or the owner
    // revoked the token on the frame's API-tokens page.
    die(
      `frame update forbidden (403): this frame has been claimed by a user and ` +
        `${
          token ? "its API token was revoked" : "no API token is available"
        }. It can no longer be updated by the skill.`,
    );
  }
  if (!res.ok) die(`frame post failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Mint an API token bound to an anonymous (ownerless) frame. The frame must
// already exist and be unclaimed — the server only lets the public role mint a
// token while the frame is ownerless. Best-effort: returns undefined if minting
// fails (e.g. the frame was already claimed), in which case the caller proceeds
// without a token (updates work only while the frame stays anonymous).
async function mintToken(slug) {
  try {
    const res = await fetch(`${APP_ORIGIN}/j/${slug}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Framejs-Client": CLIENT_TAG,
      },
      body: JSON.stringify({ description: "claude code session" }),
    });
    if (!res.ok) return undefined;
    return (await res.json())?.key;
  } catch {
    return undefined;
  }
}

// Create an immutable, content-addressed snapshot of the app on framejs.io and
// return its `/j/<sha256>` URL. Posts the same {js,modules,inputs,og} body to
// /api/shorten/json, which encodes + hashes it and stores it in S3. Unlike the
// mutable framejs.app /j/<uuid> frame, this URL always renders exactly this
// version — but it is a cache entry that expires ~30 days after last access.
// Best-effort: returns undefined if shortening isn't available.
// Best-effort read of a frame's currently-stored og, so an in-place update can
// carry title/description/image forward when the caller passed no og flags.
// Uses the public read API (same endpoint as `fetch`); bounded so a slow or
// unreachable runtime can't hang the create flow, and silent on any failure
// (a not-yet-existing frame simply returns undefined).
async function fetchStoredOg(slug) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${APP_ORIGIN}/j/${slug}.json`, {
      headers: { "X-Framejs-Client": CLIENT_TAG },
      signal: controller.signal,
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    return data?.og && Object.keys(data.og).length ? data.og : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

async function shortenSnapshot(body) {
  // Bounded so an unreachable/slow runtime can't hang the create flow — the
  // snapshot is a best-effort extra, the frame is already saved by this point.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${IO_ORIGIN}/api/shorten/json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Framejs-Client": CLIENT_TAG,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    return data?.shortUrl ||
      (data?.id ? `${IO_ORIGIN}/j/${data.id}` : undefined);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

async function cmdFetch(argv) {
  const ref = parseFrameRef(argv[0]);
  // Read from the backend the URL names (or an explicit --app-origin/--io-origin)
  // so a dev/self-hosted frame is fetched from its own stack — keeping the
  // fetch→modify round-trip on one backend, same resolution as `create`.
  resolveOrigins({
    flagApp: flagValue(argv, "--app-origin"),
    flagIo: flagValue(argv, "--io-origin"),
    urlOrigin: ref.origin,
  });
  const hex = ref.id.replaceAll("-", "").toLowerCase();
  if (/^[0-9a-f]{32}$/.test(hex)) {
    // framejs.app frame — the public read API returns the unpacked hash params
    // ({ js, inputs, modules, og }): the exact shape `create` accepts back.
    const res = await fetch(`${APP_ORIGIN}/j/${hex}.json`, {
      headers: { "X-Framejs-Client": CLIENT_TAG },
    });
    if (!res.ok) die(`fetch failed: ${res.status} ${await res.text()}`);
    console.log(JSON.stringify(await res.json(), null, 2));
    return;
  }
  if (/^[0-9a-f]{64}$/.test(hex)) {
    // Legacy framejs.io sha256 short URL.
    const res = await fetch(`${IO_ORIGIN}/api/j/${hex}`, {
      headers: { "X-Framejs-Client": CLIENT_TAG },
    });
    if (!res.ok) die(`fetch failed: ${res.status} ${await res.text()}`);
    console.log(JSON.stringify(await res.json(), null, 2));
    return;
  }
  die(
    "fetch expects a framejs.app /j/<uuid> (32 hex) or a /j/<sha256> (64 hex)",
  );
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

  const presignRes = await fetch(`${IO_ORIGIN}/api/upload/presign`, {
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

  return `${IO_ORIGIN}${canonicalPath}`;
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

// Compare dotted numeric versions ("1.0" vs "1.3.0"): >0 if a>b, <0 if a<b,
// 0 if equal. Missing trailing components count as 0 (so "1.1" > "1.0.9").
function compareVersions(a, b) {
  const pa = String(a).split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // re-check at most hourly

// Best-effort "your installed skill is out of date" nudge. Prints to stderr
// (never stdout — stdout is parsed for the frame URL) so the agent relays it to
// the user. Hard rules: never throws into the task, never adds latency more than
// once an hour, and only runs against production framejs.io — a dev/local/CI
// install (overridden origin) or an unreadable own-version is skipped, matching
// how the helper resolves the dev stacks from a nearby .env.
async function checkForUpdate() {
  try {
    if (!OWN_VERSION) return;
    // Only check against production framejs.io. A dev/local install points
    // IO_ORIGIN at a dev stack (via a nearby .env), where "latest" is whatever
    // is checked out — so skip. FRAMEJS_UPDATE_CHECK_URL is an explicit override
    // (used by the tests) that also opts a non-prod origin back in.
    const versionUrl = process.env.FRAMEJS_UPDATE_CHECK_URL ||
      (IO_ORIGIN === "https://framejs.io"
        ? `${IO_ORIGIN}/skill/version.json`
        : null);
    if (!versionUrl) return;

    const stamp = join(tmpdir(), "framejs-skill", "version-check.json");
    const now = Date.now();
    try {
      const last = JSON.parse(readFileSync(stamp, "utf8")).checkedAt || 0;
      if (now - last < UPDATE_CHECK_INTERVAL_MS) return; // checked recently
    } catch {
      // no stamp yet (or unreadable) — fall through and check
    }
    // Stamp the attempt up front so a network failure doesn't make every later
    // run re-check (and pay the timeout). Best-effort: a write failure just
    // means we re-check sooner.
    try {
      mkdirSync(dirname(stamp), { recursive: true });
      writeFileSync(stamp, JSON.stringify({ checkedAt: now }));
    } catch { /* stamp is a convenience */ }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    let latest;
    try {
      const res = await fetch(versionUrl, {
        headers: { "X-Framejs-Client": CLIENT_TAG },
        signal: controller.signal,
      });
      if (!res.ok) return;
      latest = (await res.json())?.version;
    } finally {
      clearTimeout(timer);
    }

    if (latest && compareVersions(latest, OWN_VERSION) > 0) {
      console.error(
        `framejs: installed skill v${OWN_VERSION} is out of date (latest v${latest}).\n` +
          `         Update:  curl -fsSL https://framejs.io/skill/install.sh | sh\n` +
          `         Then restart the agent. Please relay this update notice to the user.`,
      );
    }
  } catch {
    // A version check must never surface an error into the task — stay silent.
  }
}

const [cmd, ...rest] = process.argv.slice(2);
const handlers = { create: cmdCreate, fetch: cmdFetch, upload: cmdUpload };
if (!handlers[cmd]) {
  die(
    `usage: framejs.mjs <create|fetch|upload> [...]\n  create  (reads JS from stdin)  --state <file> | --id <uuid|url> | --new  --token <key>  --app-origin <url> --io-origin <url>  --module <url> --input name=value --inputs <file.json> --title <t> --description <d> --og <json> --screenshot [--screenshot-wait <ms>] [--screenshot-size <w,h>] --no-open\n  fetch   <uuid | /j/uuid | url | sha256 | /j/sha256> [--app-origin <url>] [--io-origin <url>]   (a ?token= / origin on the url is honored)\n  upload  <file-path>`,
  );
}
await checkForUpdate();
handlers[cmd](rest).catch((e) => die(e?.message || String(e)));
