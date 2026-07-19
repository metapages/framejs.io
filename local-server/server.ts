#!/usr/bin/env -S deno run -A
/**
 * framejs.io local file I/O server
 * ================================
 * A tiny, deno-only server that turns a directory tree on your disk into a
 * browsable set of framejs.io frames — completely independent of any framejs
 * backend.
 *
 *   A directory is a "frame" iff it contains a `code.js` file.
 *   Inside a frame dir:
 *     code.js        -> the `js` hash param (the actual JavaScript)   [required]
 *     options.json   -> the `options` hash param (decoded JSON)       [optional]
 *     inputs.json    -> the `inputs`  hash param                       [optional]
 *     definition.json / og.json / modules.json -> same idea            [optional]
 *     params.json    -> verbatim map of any other/raw hash params      [optional]
 *
 * Opening a frame embeds the framejs.io URL via `renderMetaframe` (from
 * @metapages/metapage). framejs.io runs as a metaframe child; on every edit the
 * parent metapage emits a "definition" event carrying the new URL, which we
 * debounce and write back to disk. Two-way sync, no round-trip to framejs.io's
 * backend. (renderMetaframe's own onUrlChange is unused — in 1.10.11 it binds to
 * "definitionupdate", which hash edits don't emit; see the client below.)
 *
 * All hash-param encoding/decoding is done by @metapages/hash-query (the same
 * library the editor uses) — nothing hand-rolled here.
 *
 * Run (local file, or straight from GitHub — no clone, no Dockerfile):
 *   deno run -A server.ts --root ~/frames --port 4700
 *   deno run -A https://raw.githubusercontent.com/metapages/framejs.io/main/local-server/server.ts --root ~/frames
 *   docker run --rm -p 4700:4700 -v "$PWD:/data" denoland/deno \
 *     run -A https://raw.githubusercontent.com/metapages/framejs.io/main/local-server/server.ts --root /data
 */

import {
  isAbsolute,
  join,
  normalize,
  resolve,
  SEPARATOR,
} from "jsr:@std/path@1";
import {
  getHashParamValueBase64DecodedFromUrl,
  getHashParamValueJsonFromUrl,
  getUrlHashParams,
  setHashParamValueBase64EncodedInUrl,
  setHashParamValueInUrl,
  setHashParamValueJsonInUrl,
} from "npm:@metapages/hash-query@0.9.12";

// ---------------------------------------------------------------------------
// Config (flags + env)
// ---------------------------------------------------------------------------
function flag(name: string, def: string): string {
  const pre = `--${name}`;
  for (let i = 0; i < Deno.args.length; i++) {
    const a = Deno.args[i];
    if (a === pre) return Deno.args[i + 1] ?? def;
    if (a.startsWith(pre + "=")) return a.slice(pre.length + 1);
  }
  return def;
}

const ROOT = resolve(
  flag("root", Deno.env.get("FRAMEJS_LOCAL_ROOT") ?? Deno.cwd()),
);
const PORT = Number(flag("port", Deno.env.get("FRAMEJS_LOCAL_PORT") ?? "4700"));
// framejs.io runtime origin the iframes point at. Override for local dev, e.g.
// --origin https://framejs-io.localhost:4430
const ORIGIN = flag(
  "origin",
  Deno.env.get("FRAMEJS_ORIGIN") ?? "https://framejs.io",
).replace(/\/+$/, "");

try {
  if (!Deno.statSync(ROOT).isDirectory) throw new Error();
} catch {
  console.error(`✗ --root is not a directory: ${ROOT}`);
  Deno.exit(1);
}

// ---------------------------------------------------------------------------
// Frame param model (which hash params map to which on-disk files)
// ---------------------------------------------------------------------------
// `js` is base64(string) (editor's useHashParamBase64) -> code.js
const JS_KEY = "js";
// These are base64(JSON) (editor's useHashParamJson) -> <key>.json
const B64_JSON = ["options", "inputs", "definition", "og", "modules"];
// UI-only params never persisted (edit is injected fresh for the embed).
const EPHEMERAL = new Set(["edit"]);
const KNOWN = new Set<string>([JS_KEY, ...B64_JSON]);

// Placeholder written into a freshly created frame's code.js. All commented out
// so the frame renders blank until the user writes something.
const PLACEHOLDER_CODE = `// New framejs frame — write your JavaScript here.
// It runs in the browser; the page is your canvas. Edits auto-save to disk.
//
// const el = document.createElement("div");
// el.textContent = "Hello from framejs";
// el.style.cssText = "font: 24px system-ui; padding: 24px";
// document.body.appendChild(el);
`;

// ---------------------------------------------------------------------------
// Safe path handling — never escape ROOT
// ---------------------------------------------------------------------------
function safePath(rel: string): string {
  const clean = normalize(rel).replace(/^(\.\.(\/|\\|$))+/, "");
  if (isAbsolute(clean)) throw new Error("absolute path rejected");
  const abs = resolve(ROOT, clean);
  if (abs !== ROOT && !abs.startsWith(ROOT + SEPARATOR)) {
    throw new Error("path escapes root");
  }
  return abs;
}
const relFromRoot = (abs: string): string =>
  abs === ROOT
    ? ""
    : abs
        .slice(ROOT.length + 1)
        .split(SEPARATOR)
        .join("/");

async function isFrameDir(abs: string): Promise<boolean> {
  try {
    return (await Deno.stat(join(abs, "code.js"))).isFile;
  } catch {
    return false;
  }
}

const readMaybe = async (
  abs: string,
  name: string,
): Promise<string | undefined> => {
  try {
    return await Deno.readTextFile(join(abs, name));
  } catch {
    return undefined;
  }
};

// ---------------------------------------------------------------------------
// Frame <-> URL (all encoding/decoding via @metapages/hash-query)
// ---------------------------------------------------------------------------
/** Build the framejs.io URL for a frame directory. `edit` forces the editor open. */
async function frameToUrl(abs: string, edit = false): Promise<string> {
  let u: URL = new URL(ORIGIN + "/");

  const code = await readMaybe(abs, "code.js");
  if (code !== undefined)
    u = setHashParamValueBase64EncodedInUrl(u, JS_KEY, code);

  for (const key of B64_JSON) {
    const txt = await readMaybe(abs, `${key}.json`);
    if (txt === undefined) continue;
    try {
      u = setHashParamValueJsonInUrl(u, key, JSON.parse(txt));
    } catch {
      /* skip malformed json file */
    }
  }

  const rawTxt = await readMaybe(abs, "params.json");
  if (rawTxt !== undefined) {
    try {
      for (const [k, v] of Object.entries(JSON.parse(rawTxt))) {
        if (EPHEMERAL.has(k) || KNOWN.has(k)) continue;
        u = setHashParamValueInUrl(u, k, String(v));
      }
    } catch {
      /* ignore */
    }
  }

  if (edit) u = setHashParamValueInUrl(u, "edit", "true");
  return u.href;
}

/** Decode a framejs.io URL and write it into a frame directory (reconciling). */
async function urlToFrame(abs: string, url: string): Promise<void> {
  await Deno.mkdir(abs, { recursive: true });
  const managed = new Set<string>();

  const code = getHashParamValueBase64DecodedFromUrl(url, JS_KEY);
  if (code !== undefined) {
    await Deno.writeTextFile(join(abs, "code.js"), code);
    managed.add("code.js");
  }

  for (const key of B64_JSON) {
    const val = getHashParamValueJsonFromUrl(url, key);
    if (val === undefined) continue;
    await Deno.writeTextFile(
      join(abs, `${key}.json`),
      JSON.stringify(val, null, 2) + "\n",
    );
    managed.add(`${key}.json`);
  }

  // Anything else in the hash (raw scalars, custom whitelisted params) is
  // preserved verbatim so the round-trip is lossless.
  const [, rawMap] = getUrlHashParams(url);
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawMap)) {
    if (KNOWN.has(k) || EPHEMERAL.has(k)) continue;
    raw[k] = v;
  }

  // Remove managed files whose param disappeared (e.g. options cleared).
  for (const name of ["code.js", ...B64_JSON.map((k) => `${k}.json`)]) {
    if (!managed.has(name)) {
      try {
        await Deno.remove(join(abs, name));
      } catch {
        /* wasn't there */
      }
    }
  }
  const rawPath = join(abs, "params.json");
  if (Object.keys(raw).length > 0) {
    await Deno.writeTextFile(rawPath, JSON.stringify(raw, null, 2) + "\n");
  } else {
    try {
      await Deno.remove(rawPath);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Expand a pasted framejs URL into a full hash-param URL that `urlToFrame` can
 * consume. Two shapes are accepted:
 *   - a short URL  https://framejs.io/j/<id>  or  https://framejs.app/j/<id>
 *     (id = uuid or legacy sha256) — resolved via the runtime's
 *     `/api/j/<id>/url` endpoint, trying the pasted origin first then our
 *     configured ORIGIN as a fallback.
 *   - a full frame URL that already carries the params in its `#hash`.
 */
async function expandFrameUrl(input: string): Promise<string> {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    throw new Error("invalid URL");
  }

  const m = u.pathname.match(/^\/j\/([^/?#]+)/);
  if (!m) {
    // Not a short URL — it must already carry the frame in its hash.
    if (!u.hash || u.hash === "#") throw new Error("not a framejs frame URL");
    return u.href;
  }

  const id = m[1];
  // Preserve a version pin (?v= / ?sha256=) if present so a published snapshot
  // resolves to that exact version.
  const qs = u.searchParams.toString();
  const suffix = qs ? `?${qs}` : "";
  const origins = [u.origin, ORIGIN].filter((o, i, a) => a.indexOf(o) === i);

  let lastErr = "resolve failed";
  for (const origin of origins) {
    try {
      const res = await fetch(`${origin}/api/j/${id}/url${suffix}`);
      if (res.ok) {
        const full = (await res.text()).trim();
        if (full) return full;
        lastErr = "empty response";
      } else {
        lastErr = `HTTP ${res.status} from ${origin}`;
      }
    } catch (e) {
      lastErr = String(e instanceof Error ? e.message : e);
    }
  }
  throw new Error(`could not resolve short URL: ${lastErr}`);
}

// ---------------------------------------------------------------------------
// Blueprint CSS — loaded from the live website, cached, with offline fallback
// ---------------------------------------------------------------------------
let cssCache: { at: number; body: string } | null = null;
const FALLBACK_CSS = `:root{--paper:#f4f1ea;--ink:#14213d;--accent:#2f6fed;--rule:#c9c3b6}
body{font-family:"IBM Plex Sans",system-ui,sans-serif;background:var(--paper);color:var(--ink)}`;

async function blueprintCss(): Promise<string> {
  if (cssCache && Date.now() - cssCache.at < 5 * 60_000) return cssCache.body;
  try {
    const res = await fetch(`${ORIGIN}/blueprint.css`);
    if (res.ok && (res.headers.get("content-type") ?? "").includes("css")) {
      const body = await res.text();
      cssCache = { at: Date.now(), body };
      return body;
    }
  } catch {
    /* offline / not deployed yet */
  }
  return FALLBACK_CSS;
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  try {
    if (path === "/api/list") {
      const abs = safePath(url.searchParams.get("path") ?? "");
      const entries: Array<{
        name: string;
        kind: "dir" | "file";
        frame: boolean;
      }> = [];
      for await (const e of Deno.readDir(abs)) {
        if (e.name.startsWith(".")) continue;
        entries.push({
          name: e.name,
          kind: e.isDirectory ? "dir" : "file",
          frame: e.isDirectory ? await isFrameDir(join(abs, e.name)) : false,
        });
      }
      entries.sort((a, b) =>
        a.kind !== b.kind
          ? a.kind === "dir"
            ? -1
            : 1
          : a.name.localeCompare(b.name),
      );
      return json({
        root: ROOT,
        path: relFromRoot(abs),
        isFrame: await isFrameDir(abs),
        entries,
      });
    }

    if (path === "/api/frame" && req.method === "GET") {
      const abs = safePath(url.searchParams.get("path") ?? "");
      if (!(await isFrameDir(abs))) return json({ error: "not a frame" }, 400);
      return json({ path: relFromRoot(abs), url: await frameToUrl(abs) });
    }

    if (path === "/api/frame" && req.method === "POST") {
      const abs = safePath(url.searchParams.get("path") ?? "");
      const body = await req.json().catch(() => ({}));
      const frameUrl = typeof body?.url === "string" ? body.url : "";
      if (!frameUrl) return json({ error: "missing url" }, 400);
      await urlToFrame(abs, frameUrl);
      return json({ ok: true, savedAt: new Date().toISOString() });
    }

    // --- API: create a new frame folder (with placeholder code.js) ----
    if (path === "/api/create" && req.method === "POST") {
      const parentRel = url.searchParams.get("path") ?? "";
      const body = await req.json().catch(() => ({}));
      const name = typeof body?.name === "string" ? body.name.trim() : "";
      if (!name) return json({ error: "folder name required" }, 400);
      if (
        /[/\\]/.test(name) ||
        name === "." ||
        name === ".." ||
        name.startsWith(".")
      ) {
        return json({ error: "invalid folder name" }, 400);
      }
      const rel = parentRel ? `${parentRel}/${name}` : name;
      const abs = safePath(rel); // rejects escapes
      try {
        await Deno.stat(abs);
        return json({ error: "already exists" }, 409);
      } catch {
        /* good — does not exist */
      }
      await Deno.mkdir(abs, { recursive: true });
      await Deno.writeTextFile(join(abs, "code.js"), PLACEHOLDER_CODE);
      return json({ ok: true, path: relFromRoot(abs) });
    }

    // --- API: import a framejs URL into a frame, replacing its contents -----
    // Accepts a short /j/:id URL (framejs.io or framejs.app) or a full
    // hash-param URL. Expands short URLs, then reconciles the frame dir to the
    // incoming params — any managed file not present in the incoming is deleted.
    if (path === "/api/import" && req.method === "POST") {
      const abs = safePath(url.searchParams.get("path") ?? "");
      const body = await req.json().catch(() => ({}));
      const raw = typeof body?.url === "string" ? body.url.trim() : "";
      if (!raw) return json({ error: "missing url" }, 400);
      const full = await expandFrameUrl(raw);
      await urlToFrame(abs, full);
      return json({
        ok: true,
        path: relFromRoot(abs),
        savedAt: new Date().toISOString(),
      });
    }

    if (path === "/blueprint.css") {
      return new Response(await blueprintCss(), {
        headers: { "content-type": "text/css; charset=utf-8" },
      });
    }

    if (path === "/" || path === "/index.html") {
      return new Response(PAGE, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return new Response("Not found", { status: 404 });
  } catch (err) {
    return json(
      { error: String(err instanceof Error ? err.message : err) },
      400,
    );
  }
}

// ---------------------------------------------------------------------------
// Client — file browser + renderMetaframe two-way sync (single inlined page)
// ---------------------------------------------------------------------------
const PAGE = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>framejs · local disk</title>
<link rel="stylesheet" href="/blueprint.css" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body { display: flex; flex-direction: column; min-height: 100vh; }
  header {
    display: flex; align-items: center; gap: 12px; padding: 10px 16px;
    border-bottom: 1px solid var(--rule, #c9c3b6);
    background: color-mix(in srgb, var(--paper, #f4f1ea) 88%, var(--ink, #14213d));
    position: sticky; top: 0; z-index: 5;
  }
  header .wordmark { font-family: "IBM Plex Mono", ui-monospace, monospace; font-weight: 600; letter-spacing: .02em; }
  header .spacer { flex: 1; }
  #status { font: 500 12px/1 "IBM Plex Mono", ui-monospace, monospace; opacity: .8; text-align: right; }
  nav.crumbs { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; font-size: 14px; }
  nav.crumbs a { color: var(--accent, #2f6fed); cursor: pointer; text-decoration: none; }
  nav.crumbs a:hover { text-decoration: underline; }
  nav.crumbs span.sep { opacity: .4; }
  main#browser { padding: 16px; max-width: 980px; margin: 0 auto; width: 100%; }
  ul.listing { list-style: none; margin: 0; padding: 0; display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }
  li.row { position: relative; border: 1px solid var(--rule, #c9c3b6); border-radius: 8px; background: rgba(255,255,255,.35); }
  li.row button { all: unset; display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 14px; cursor: pointer; }
  li.row button:hover { background: rgba(47,111,237,.08); }
  li.row .ic { font-size: 18px; width: 22px; text-align: center; }
  li.row .nm { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  li.frame { border-color: var(--accent, #2f6fed); background: rgba(47,111,237,.06); }
  li.frame .badge { position: absolute; top: 5px; right: 5px; pointer-events: none;
    font: 600 9px/1 "IBM Plex Mono", ui-monospace, monospace; color: var(--accent, #2f6fed);
    background: var(--paper, #f4f1ea); border: 1px solid var(--accent, #2f6fed);
    border-radius: 999px; padding: 3px 6px; letter-spacing: .04em; }
  .empty { opacity: .6; font-style: italic; padding: 24px 4px; }
  #frameView { display: none; flex-direction: column; flex: 1; min-height: 0; }
  #frameView.open { display: flex; }
  #frameBar { display: flex; align-items: center; gap: 12px; padding: 8px 14px; border-bottom: 1px solid var(--rule, #c9c3b6); }
  #frameBar .path { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 13px; }
  #frameRoot { flex: 1; min-height: 0; position: relative; }
  button.btn { all: unset; cursor: pointer; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--ink, #14213d); font-size: 13px; font-weight: 500; }
  button.btn:hover { background: rgba(20,33,61,.06); }
  button.btn.primary { background: var(--accent, #2f6fed); color: #fff; border-color: var(--accent, #2f6fed); }
  button.btn.primary:hover { filter: brightness(1.08); }
  /* create modal */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(20,33,61,.4); display: none; align-items: center; justify-content: center; z-index: 20; }
  .modal-backdrop.open { display: flex; }
  .modal { background: var(--paper, #f4f1ea); border: 1px solid var(--rule, #c9c3b6); border-radius: 10px; padding: 20px; width: min(440px, 92vw); box-shadow: 0 14px 44px rgba(0,0,0,.28); }
  .modal h3 { margin: 0 0 6px; font-family: "IBM Plex Sans", system-ui, sans-serif; }
  .modal .hint { margin: 0 0 12px; font-size: 13px; opacity: .7; font-family: "IBM Plex Mono", ui-monospace, monospace; }
  .modal input { width: 100%; padding: 9px 11px; border: 1px solid var(--rule, #c9c3b6); border-radius: 6px; font: 14px "IBM Plex Mono", ui-monospace, monospace; background: rgba(255,255,255,.6); }
  .modal input:focus { outline: 2px solid var(--accent, #2f6fed); outline-offset: 1px; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
  .modal-error { color: #b00020; font-size: 12px; margin-top: 8px; min-height: 1em; }
</style>
</head>
<body>
<header>
  <span class="wordmark">framejs<span style="opacity:.5">/local</span></span>
  <nav class="crumbs" id="crumbs"></nav>
  <span class="spacer"></span>
  <button class="btn primary" id="createBtn">＋ New frame</button>
  <span id="status"></span>
</header>

<main id="browser"><ul class="listing" id="listing"></ul></main>

<div class="modal-backdrop" id="modal">
  <div class="modal">
    <h3>New frame</h3>
    <p class="hint" id="modalHint"></p>
    <input id="folderName" placeholder="my-frame" autocomplete="off" spellcheck="false" />
    <div class="modal-error" id="modalError"></div>
    <div class="modal-actions">
      <button class="btn" id="modalCancel">Cancel</button>
      <button class="btn primary" id="modalCreate">Create</button>
    </div>
  </div>
</div>

<div class="modal-backdrop" id="importModal">
  <div class="modal">
    <h3>Import from URL</h3>
    <p class="hint" id="importHint"></p>
    <input id="importUrlInput" placeholder="https://framejs.io/j/…" autocomplete="off" spellcheck="false" />
    <div class="modal-error" id="importError"></div>
    <div class="modal-actions">
      <button class="btn" id="importCancel">Cancel</button>
      <button class="btn primary" id="importConfirm">Import</button>
    </div>
  </div>
</div>

<section id="frameView">
  <div id="frameBar">
    <button class="btn" id="backBtn">← Back</button>
    <button class="btn" id="importBtn" title="Replace this frame from a framejs.io / framejs.app URL">⤓ Import URL</button>
    <span class="path" id="framePath"></span>
    <span class="spacer" style="flex:1"></span>
    <span id="saveStatus" style="font:500 12px 'IBM Plex Mono',monospace;opacity:.8"></span>
  </div>
  <div id="frameRoot"></div>
</section>

<script type="module">
import { renderMetaframe } from "https://esm.sh/@metapages/metapage@1.10.11";

const $ = (id) => document.getElementById(id);
const qp = () => new URLSearchParams(location.search);
const setStatus = (t) => { $("status").textContent = t; };
const setSave = (t) => { $("saveStatus").textContent = t; };

function go(path, view) {
  const u = new URLSearchParams();
  if (path) u.set("path", path);
  if (view) u.set("view", view);
  history.pushState(null, "", "?" + u.toString());
  render();
}

function crumbs(path) {
  const el = $("crumbs"); el.innerHTML = "";
  const mk = (label, p) => { const a = document.createElement("a"); a.textContent = label; a.onclick = () => go(p); el.appendChild(a); };
  mk("root", "");
  let acc = "";
  for (const s of (path ? path.split("/") : [])) {
    const sep = document.createElement("span"); sep.className = "sep"; sep.textContent = "/"; el.appendChild(sep);
    acc = acc ? acc + "/" + s : s; mk(s, acc);
  }
}

function frameRow(name, path) {
  const li = document.createElement("li"); li.className = "row frame";
  const b = document.createElement("button");
  b.onclick = () => go(path, "frame");
  b.innerHTML = '<span class="ic">◆</span><span class="nm"></span><span class="badge">FRAME</span>';
  b.querySelector(".nm").textContent = name; li.appendChild(b); return li;
}
function dirRow(name, path) {
  const li = document.createElement("li"); li.className = "row";
  const b = document.createElement("button"); b.onclick = () => go(path);
  b.innerHTML = '<span class="ic">📁</span><span class="nm"></span>';
  b.querySelector(".nm").textContent = name; li.appendChild(b); return li;
}
function fileRow(name) {
  const li = document.createElement("li"); li.className = "row";
  const b = document.createElement("button"); b.style.cursor = "default";
  b.innerHTML = '<span class="ic">📄</span><span class="nm"></span>';
  b.querySelector(".nm").textContent = name; li.appendChild(b); return li;
}

async function renderBrowser(path) {
  closeFrame();
  $("frameView").classList.remove("open");
  $("browser").style.display = "";
  const data = await (await fetch("/api/list?path=" + encodeURIComponent(path))).json();
  if (data.error) { setStatus("✗ " + data.error); return; }
  setStatus(data.root);
  crumbs(data.path);
  const list = $("listing"); list.innerHTML = "";
  if (data.isFrame) list.appendChild(frameRow("· open this frame ·", data.path));
  if (!data.entries.length && !data.isFrame) {
    const p = document.createElement("p"); p.className = "empty"; p.textContent = "empty directory"; list.appendChild(p); return;
  }
  for (const e of data.entries) {
    const child = data.path ? data.path + "/" + e.name : e.name;
    if (e.kind === "dir" && e.frame) list.appendChild(frameRow(e.name, child));
    else if (e.kind === "dir") list.appendChild(dirRow(e.name, child));
    else list.appendChild(fileRow(e.name));
  }
}

// ---- frame view + two-way sync via renderMetaframe ----
let handle = null;       // renderMetaframe result (has .metapage / .dispose)
let listenerOff = null;  // disposer for our definition listener
let saveTimer = null;
let currentFramePath = null;

function closeFrame() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  if (listenerOff) { try { listenerOff(); } catch {} listenerOff = null; }
  if (handle && handle.dispose) { try { handle.dispose(); } catch {} }
  handle = null; currentFramePath = null;
  $("frameRoot").innerHTML = "";
}

// Debounced write of the frame's current URL back to disk.
function scheduleSave(target, newUrl) {
  setSave("editing…");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const r = await fetch("/api/frame?path=" + encodeURIComponent(target), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: newUrl }),
      });
      const d = await r.json();
      setSave(d.ok ? "saved ✓ " + new Date().toLocaleTimeString() : "✗ " + (d.error || "save failed"));
    } catch (err) { setSave("✗ " + err); }
  }, 500);
}

async function openFrame(path) {
  closeFrame();
  currentFramePath = path;
  $("browser").style.display = "none";
  $("frameView").classList.add("open");
  $("framePath").textContent = "/" + path;
  setSave("loading…");
  const data = await (await fetch("/api/frame?path=" + encodeURIComponent(path))).json();
  if (data.error) { setSave("✗ " + data.error); return; }
  handle = await renderMetaframe({ url: data.url, rootDiv: $("frameRoot"), onUrlChange: (newUrl) => {
    console.log("URL changed to:", newUrl);
  }})
  
  // NOTE: don't use renderMetaframe's onUrlChange — in metapage 1.10.11 it binds
  // to the "definitionupdate" event, but a child hash edit emits "definition".
  // Subscribe to that directly (which also enables the emit, since it's gated on
  // there being a "definition" listener). One metaframe, so take its url.
  listenerOff = handle.metapage.addListenerReturnDisposer("definition", (e) => {
    const mfs = e && e.definition && e.definition.metaframes;
    const first = mfs && Object.values(mfs)[0];
    if (first && first.url) scheduleSave(path, first.url);
  });
  setSave("synced");
}

$("backBtn").onclick = () => {
  const parent = currentFramePath && currentFramePath.includes("/")
    ? currentFramePath.slice(0, currentFramePath.lastIndexOf("/")) : "";
  go(parent);
};

// ---- create-frame modal ----
function openModal() {
  const here = qp().get("path") || "";
  $("modalHint").textContent = "creates a frame in  /" + here;
  $("modalError").textContent = "";
  $("folderName").value = "";
  $("modal").classList.add("open");
  $("folderName").focus();
}
function closeModal() { $("modal").classList.remove("open"); }
async function submitCreate() {
  const name = $("folderName").value.trim();
  if (!name) { $("modalError").textContent = "Enter a folder name"; return; }
  const parent = qp().get("path") || "";
  try {
    const r = await fetch("/api/create?path=" + encodeURIComponent(parent), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const d = await r.json();
    if (!r.ok || d.error) { $("modalError").textContent = d.error || "Create failed"; return; }
    closeModal();
    go(d.path, "frame"); // open the new frame ready to edit
  } catch (err) { $("modalError").textContent = String(err); }
}
$("createBtn").onclick = openModal;
$("modalCancel").onclick = closeModal;
$("modalCreate").onclick = submitCreate;
$("modal").onclick = (e) => { if (e.target === $("modal")) closeModal(); };
$("folderName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); submitCreate(); }
  else if (e.key === "Escape") { e.preventDefault(); closeModal(); }
});

// ---- import-from-URL: replace the current frame's files from a framejs URL ----
// Accepts a short /j/:id URL (framejs.io / framejs.app) or a full hash-param
// URL; the server expands it and reconciles the frame dir, deleting any managed
// file the incoming frame doesn't use.
function isFrameishUrl(text) {
  try {
    const u = new URL(text.trim());
    return /^\\/j\\/[^/?#]+/.test(u.pathname) || /(?:^|[#&?])js=/.test(u.hash);
  } catch { return false; }
}

async function importIntoFrame(path, rawUrl) {
  const r = await fetch("/api/import?path=" + encodeURIComponent(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: rawUrl }),
  });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error || "import failed");
  return d;
}

function openImport() {
  $("importHint").textContent = "replaces the frame at  /" + (currentFramePath || "");
  $("importError").textContent = "";
  $("importUrlInput").value = "";
  $("importModal").classList.add("open");
  $("importUrlInput").focus();
}
function closeImport() { $("importModal").classList.remove("open"); }
async function submitImport() {
  if (!currentFramePath) { $("importError").textContent = "Open a frame first"; return; }
  const raw = $("importUrlInput").value.trim();
  if (!raw) { $("importError").textContent = "Paste a framejs URL"; return; }
  $("importError").textContent = "importing…";
  try {
    await importIntoFrame(currentFramePath, raw);
    closeImport();
    openFrame(currentFramePath); // reload the embed with the imported content
  } catch (err) { $("importError").textContent = String(err.message || err); }
}
$("importBtn").onclick = openImport;
$("importCancel").onclick = closeImport;
$("importConfirm").onclick = submitImport;
$("importModal").onclick = (e) => { if (e.target === $("importModal")) closeImport(); };
$("importUrlInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); submitImport(); }
  else if (e.key === "Escape") { e.preventDefault(); closeImport(); }
});

// Paste a framejs URL anywhere in the parent page while viewing a frame to
// import it straight into the open frame. (Pastes that land inside the embedded
// iframe stay with the editor; use the Import button for those.)
document.addEventListener("paste", (e) => {
  if (!currentFramePath) return;
  if ($("importModal").classList.contains("open")) return; // let the field handle it
  const text = (e.clipboardData || window.clipboardData)?.getData("text") || "";
  if (!isFrameishUrl(text)) return;
  e.preventDefault();
  (async () => {
    setSave("importing…");
    try {
      await importIntoFrame(currentFramePath, text.trim());
      setSave("imported ✓");
      openFrame(currentFramePath);
    } catch (err) { setSave("✗ " + (err.message || err)); }
  })();
});

function render() {
  const p = qp().get("path") || "";
  const inFrame = qp().get("view") === "frame";
  $("createBtn").style.display = inFrame ? "none" : "";
  if (inFrame) openFrame(p);
  else renderBrowser(p);
}
window.addEventListener("popstate", render);
render();
</script>
</body>
</html>`;

console.log(`framejs local file I/O`);
console.log(`  root:   ${ROOT}`);
console.log(`  origin: ${ORIGIN}`);
console.log(`  serving http://localhost:${PORT}`);
Deno.serve({ port: PORT }, handler);
