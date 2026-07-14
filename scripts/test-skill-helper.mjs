#!/usr/bin/env node
// test-skill-helper.mjs — behavioral integration test for the framejs Agent
// Skill helper (worker/static/skill/framejs/scripts/framejs.mjs).
//
// Runs the real `create`/`fetch` commands against a local stub that stands in
// for the framejs.app /j/<uuid>.json API, asserting the create-or-update flow:
//   - a fresh session mints a UUIDv7 and POSTs to /j/<slug>.json (201),
//   - re-running with the same --state UPDATES the same frame,
//   - --new starts a different frame, --id targets a specific one,
//   - the printed output carries the framejs.app page URL and an immutable
//     framejs.io /j/<sha256> snapshot URL,
//   - origins are picked up from a nearby .env (local-dev behavior),
//   - fetch round-trips the stored params.
//
// Hermetic: no browser, no external stack. Run: node scripts/test-skill-helper.mjs

import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const pExecFile = promisify(execFile);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HELPER = join(ROOT, "worker/static/skill/framejs/scripts/framejs.mjs");

// --- stub framejs.app: records POSTs, serves the latest body back on GET ------
// Also stands in for the framejs.io snapshot shortener (POST /api/shorten/json),
// returning a content-addressed /j/<sha256> id for the posted body.
// The app layer (framejs.app) and runtime layer (framejs.io) are DISTINCT
// origins in every real deployment. The helper's origin resolution keys off
// that distinction (isRuntimeOrigin compares a frame URL's origin to
// FRAMEJS_IO_ORIGIN), so the fixture must expose two different origins — else an
// app-layer /j/<uuid> URL whose origin happens to equal IO_ORIGIN is
// misclassified as a runtime URL. Both origins route to the SAME shared handler
// (and thus the same posts/store/shortens), so a single stub still backs every
// endpoint; only the origin strings differ.
function startStub() {
  const posts = [];
  const shortens = []; // { id, params } per POST /api/shorten/json
  const store = new Map(); // slug -> latest params
  const handler = (req, res) => {
    const m = req.url.match(/^\/j\/([0-9a-f]+)\.json$/i);
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      // Snapshot shortener: hash the body → immutable /j/<sha256> copy.
      if (req.method === "POST" && req.url === "/api/shorten/json") {
        const id = createHash("sha256").update(body || "").digest("hex");
        shortens.push({ id, params: JSON.parse(body || "{}") });
        res.writeHead(200, { "content-type": "application/json" })
          .end(JSON.stringify({ id }));
        return;
      }
      if (!m) {
        res.writeHead(404).end();
        return;
      }
      const slug = m[1];
      if (req.method === "POST") {
        const params = JSON.parse(body || "{}");
        const isCreate = !store.has(slug);
        store.set(slug, params);
        posts.push({ slug, params });
        res.writeHead(isCreate ? 201 : 200, {
          "content-type": "application/json",
        }).end(JSON.stringify(params));
      } else if (req.method === "GET") {
        if (!store.has(slug)) {
          res.writeHead(404, { "content-type": "application/json" })
            .end(JSON.stringify({ error: "not found" }));
        } else {
          res.writeHead(200, { "content-type": "application/json" })
            .end(JSON.stringify(store.get(slug)));
        }
      } else {
        res.writeHead(405).end();
      }
    });
  };
  const appServer = createServer(handler);
  const ioServer = createServer(handler);
  const listen = (srv) =>
    new Promise((r) =>
      srv.listen(0, "127.0.0.1", () =>
        r(`http://127.0.0.1:${srv.address().port}`))
    );
  return Promise.all([listen(appServer), listen(ioServer)]).then(
    ([appOrigin, ioOrigin]) => ({
      servers: [appServer, ioServer],
      posts,
      shortens,
      store,
      appOrigin,
      ioOrigin,
    }),
  );
}

const SRC = "export function onInputs(inputs){ return inputs; }\n";

// A fake `open`/`xdg-open` on PATH so tests can observe whether the helper
// tried to open a browser without ever launching a real one. Each invocation
// appends the given URL as a line to OPEN_LOG.
const openBinDir = mkdtempSync(join(tmpdir(), "framejs-skill-openbin-"));
const openLog = join(openBinDir, "opened.log");
writeFileSync(openLog, "");
for (const name of ["open", "xdg-open"]) {
  const bin = join(openBinDir, name);
  writeFileSync(bin, `#!/bin/sh\necho "$1" >> "${openLog}"\n`);
  chmodSync(bin, 0o755);
}
const readOpenLog = () =>
  readFileSync(openLog, "utf8").split("\n").filter(Boolean);

// Run the helper (async so the in-process stub server keeps serving during the
// child's request — execFileSync would block the event loop and deadlock).
async function run(cmd, args, { env = {}, cwd = ROOT } = {}) {
  // A null override deletes that var from the child env (to test .env fallback).
  const childEnv = {
    ...process.env,
    PATH: `${openBinDir}:${process.env.PATH}`,
    ...env,
  };
  for (const k of Object.keys(childEnv)) {
    if (childEnv[k] == null) delete childEnv[k];
  }
  const promise = pExecFile("node", [HELPER, cmd, ...args], {
    cwd,
    env: childEnv,
    encoding: "utf8",
  });
  promise.child.stdin.end(SRC); // provide the JS on stdin, then EOF
  const { stdout } = await promise;
  return stdout;
}

// Run `create` and return its stdout lines.
async function create(args, opts) {
  return (await run("create", args, opts)).trim().split("\n");
}

function parse(lines) {
  const page = lines[0];
  const snapshot = lines.find((l) => l.startsWith("snapshot: "))?.slice(10);
  const slug = page.match(/\/j\/([0-9a-f]+)$/i)?.[1];
  return { page, snapshot, slug };
}

// The frame id (hyphenated uuid) now lives only in the --state file — the helper
// no longer echoes an `id:` line to stdout.
const stateUuid = (statePath) =>
  JSON.parse(readFileSync(statePath, "utf8")).uuid;

const results = [];
const check = (name, fn) => {
  try {
    fn();
    results.push([true, name]);
  } catch (e) {
    results.push([false, `${name}\n    ${e.message.split("\n")[0]}`]);
  }
};

const { servers, posts, shortens, appOrigin, ioOrigin } = await startStub();
const origin = appOrigin; // framejs.app (account) layer origin
const IO = ioOrigin; // framejs.io (runtime) origin — DISTINCT from the app origin
const tmp = mkdtempSync(join(tmpdir(), "framejs-skill-test-"));
const env = { FRAMEJS_APP_ORIGIN: origin, FRAMEJS_IO_ORIGIN: IO };

try {
  // 1. First create mints a frame and POSTs it.
  const state = join(tmp, "frame.json");
  const c1 = parse(await create(["--state", state, "--no-open", "--title", "T1"], {
    env,
  }));
  check("create posts to framejs.app /j/<slug>.json", () => {
    assert.equal(posts.length, 1);
    assert.equal(posts[0].slug, c1.slug);
    assert.equal(posts[0].params.js, SRC);
    assert.deepEqual(posts[0].params.og, { title: "T1", description: "" });
  });
  check("mints a 32-hex uuidv7 slug recorded as the frame uuid", () => {
    assert.match(c1.slug, /^[0-9a-f]{32}$/);
    const uuid = stateUuid(state);
    assert.equal(uuid.replaceAll("-", ""), c1.slug);
    assert.equal(uuid[14], "7"); // uuid version nibble
  });
  check("prints the framejs.app page URL and an immutable snapshot URL", () => {
    assert.equal(c1.page, `${origin}/j/${c1.slug}`);
    assert.ok(c1.snapshot, "prints a snapshot: line");
    assert.ok(c1.snapshot.startsWith(`${IO}/j/`), `snapshot url: ${c1.snapshot}`);
    const sha = c1.snapshot.match(/\/j\/([0-9a-f]+)$/)?.[1];
    assert.match(sha, /^[0-9a-f]{64}$/); // content-addressed snapshot id
  });
  check("snapshot posts js as a raw string, not a JSON blob", () => {
    // Regression: packHashParamValue used to JSON.stringify every value
    // (including js). The snapshot body (and the frame POST above) must carry
    // `js` as the raw source string so the client-side base64/URI decoder —
    // which does no JSON.parse — round-trips it exactly. A JSON.stringify'd
    // value would come back quoted/escaped and a `%` in the source would trip
    // the client's legacy double-decode into a `URIError: URI malformed`.
    assert.equal(shortens[0].params.js, SRC);
  });
  check("records the frame in the --state file", () => {
    const saved = JSON.parse(readFileSync(state, "utf8"));
    assert.equal(saved.uuid.replaceAll("-", ""), c1.slug);
    assert.equal(saved.appOrigin, origin);
  });

  // 2. Same --state → UPDATE the same frame.
  const c2 = parse(await create(["--state", state, "--no-open"], { env }));
  check("re-running with the same --state updates the same frame", () => {
    assert.equal(c2.slug, c1.slug);
    assert.equal(posts.length, 2);
    assert.equal(posts[1].slug, c1.slug);
  });

  // 3. --new starts a different frame (and becomes the session's frame).
  const c3 = parse(await create(["--state", state, "--no-open", "--new"], { env }));
  check("--new starts a distinct frame", () => {
    assert.notEqual(c3.slug, c1.slug);
    assert.equal(stateUuid(state).replaceAll("-", ""), c3.slug);
  });

  // 4. --id targets a specific frame regardless of state.
  const fixed = "0192aaaa-bbbb-71cc-8ddd-eeeeeeeeeeee";
  const c4 = parse(await create(["--id", fixed, "--state", state, "--no-open"], {
    env,
  }));
  check("--id targets the given frame", () => {
    assert.equal(c4.slug, fixed.replaceAll("-", ""));
  });

  // 5. Origins are read from a nearby .env when not set in the environment.
  const envDir = mkdtempSync(join(tmpdir(), "framejs-skill-env-"));
  writeFileSync(
    join(envDir, ".env"),
    `FRAMEJS_APP_ORIGIN=${origin}\nFRAMEJS_IO_ORIGIN=${IO}\n`,
  );
  const before = posts.length;
  const c5 = parse(await create(["--state", join(envDir, "s.json"), "--no-open"], {
    cwd: envDir, // no *_ORIGIN in env → helper must load envDir/.env
    env: { FRAMEJS_APP_ORIGIN: null, FRAMEJS_IO_ORIGIN: null },
  }));
  check("loads dev-stack origins from a nearby .env", () => {
    assert.equal(c5.page, `${origin}/j/${c5.slug}`);
    assert.equal(posts.length, before + 1);
  });
  rmSync(envDir, { recursive: true, force: true });

  // 6. fetch round-trips the stored params for a framejs.app frame.
  const fetchOut = await run("fetch", [c1.slug], { env });
  check("fetch returns the stored hash params", () => {
    assert.equal(JSON.parse(fetchOut).js, SRC);
  });

  // 6b. A full frame URL's origin drives the target backend, overriding the env
  // baseline — the dev/self-hosted case: `create --id <dev-url>?token=…` must
  // POST to the URL's origin (with the URL's token) even when env points
  // elsewhere. Env here names an unroutable app origin so a wrong target fails.
  const bogus = "http://127.0.0.1:1"; // connection-refused if ever used
  const urlSlug = "0192cccc-dddd-71ee-8fff-aaaaaaaaaaaa".replaceAll("-", "");
  const beforeUrl = posts.length;
  const cUrl = parse(await create([
    "--id",
    `${origin}/j/${urlSlug}?token=cap-xyz`,
    "--state",
    join(tmp, "url-origin.json"),
    "--no-open",
  ], { env: { FRAMEJS_APP_ORIGIN: bogus, FRAMEJS_IO_ORIGIN: IO } }));
  check("a full frame URL's origin overrides the env app origin", () => {
    assert.equal(posts.length, beforeUrl + 1);
    assert.equal(posts[posts.length - 1].slug, urlSlug);
    assert.equal(cUrl.page, `${origin}/j/${urlSlug}`);
  });
  check("records both origins in --state", () => {
    const saved = JSON.parse(readFileSync(join(tmp, "url-origin.json"), "utf8"));
    assert.equal(saved.appOrigin, origin);
    assert.equal(saved.ioOrigin, IO);
  });

  // 6c. --app-origin flag wins outright (even over a full-URL origin).
  const flagSlug = "0192dddd-eeee-71ff-8aaa-bbbbbbbbbbbb".replaceAll("-", "");
  const beforeFlag = posts.length;
  await create([
    "--id",
    `${bogus}/j/${flagSlug}`,
    "--app-origin",
    origin,
    "--state",
    join(tmp, "flag-origin.json"),
    "--no-open",
  ], { env: { FRAMEJS_APP_ORIGIN: bogus, FRAMEJS_IO_ORIGIN: IO } });
  check("--app-origin flag overrides both env and the URL origin", () => {
    assert.equal(posts.length, beforeFlag + 1);
    assert.equal(posts[posts.length - 1].slug, flagSlug);
  });

  // 6d. fetch honors the origin carried on a full frame URL too.
  const fetchUrl = await run(
    "fetch",
    [`${origin}/j/${c1.slug}`],
    { env: { FRAMEJS_APP_ORIGIN: bogus, FRAMEJS_IO_ORIGIN: IO } },
  );
  check("fetch honors the origin on a full frame URL", () => {
    assert.equal(JSON.parse(fetchUrl).js, SRC);
  });

  // 7. The browser opens only for a freshly minted frame — updates reach the
  // same already-open tab via its live-update subscription, so reopening it
  // would just spawn a redundant new tab. None of the calls above pass
  // --no-open here, so a real open would show up in the shimmed open/xdg-open
  // log (see openBinDir) if the helper tried.
  const openState = join(tmp, "open-frame.json");
  await create(["--state", openState], { env }); // mints a new frame
  check("opens the browser for a freshly minted frame", () => {
    assert.equal(readOpenLog().length, 1);
  });
  await create(["--state", openState], { env }); // updates the same frame
  check("does not reopen the browser when updating the same frame", () => {
    assert.equal(readOpenLog().length, 1); // unchanged
  });
  await create(["--id", fixed, "--state", openState], { env }); // --id update
  check("does not open the browser for an explicit --id update", () => {
    assert.equal(readOpenLog().length, 1); // unchanged
  });

  // 8. Update-check nudge. The helper fetches /skill/version.json (here via the
  //    FRAMEJS_UPDATE_CHECK_URL test seam) and, when the served "latest" is
  //    newer than its own SKILL.md version, prints an out-of-date notice to
  //    STDERR only — never polluting the stdout the agent parses for the URL.
  //    Throttled to once per hour via a stamp in tmpdir.
  const stamp = join(tmpdir(), "framejs-skill", "version-check.json");
  let latestVersion = "99.0.0";
  const vserver = createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" })
      .end(JSON.stringify({ version: latestVersion }));
  });
  await new Promise((r) => vserver.listen(0, "127.0.0.1", r));
  const vurl = `http://127.0.0.1:${vserver.address().port}/skill/version.json`;

  // Full stdout+stderr capture (the `run` helper above returns stdout only).
  async function createFull(args, extraEnv) {
    const childEnv = {
      ...process.env,
      PATH: `${openBinDir}:${process.env.PATH}`,
      ...env,
      ...extraEnv,
    };
    const p = pExecFile("node", [HELPER, "create", ...args], {
      cwd: ROOT,
      env: childEnv,
      encoding: "utf8",
    });
    p.child.stdin.end(SRC);
    return await p; // { stdout, stderr }
  }

  const upState = join(tmp, "update-frame.json");
  rmSync(stamp, { force: true }); // ensure the throttle gate is open
  const outdated = await createFull(["--state", upState, "--no-open"], {
    FRAMEJS_UPDATE_CHECK_URL: vurl,
  });
  check("prints an update nudge to stderr when the skill is out of date", () => {
    assert.match(outdated.stderr, /out of date \(latest v99\.0\.0\)/);
    assert.match(outdated.stderr, /install\.sh/);
  });
  check("keeps stdout clean — the page URL is still line 1", () => {
    assert.match(outdated.stdout.trim().split("\n")[0], /\/j\/[0-9a-f]{32}$/);
  });

  // Immediate re-run: within the throttle window, no second check/notice.
  const throttled = await createFull(["--state", upState, "--no-open"], {
    FRAMEJS_UPDATE_CHECK_URL: vurl,
  });
  check("does not re-check within the throttle window", () => {
    assert.doesNotMatch(throttled.stderr, /out of date/);
  });

  // Current install (served version not newer): silent even after a fresh check.
  rmSync(stamp, { force: true });
  latestVersion = "0.0.1";
  const current = await createFull(["--state", upState, "--no-open"], {
    FRAMEJS_UPDATE_CHECK_URL: vurl,
  });
  check("stays silent when the installed skill is current", () => {
    assert.doesNotMatch(current.stderr, /out of date/);
  });
  vserver.close();
} finally {
  for (const s of servers) s.close();
  rmSync(tmp, { recursive: true, force: true });
  rmSync(openBinDir, { recursive: true, force: true });
}

// --- report -----------------------------------------------------------------
let failed = 0;
for (const [ok, name] of results) {
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}`);
  if (!ok) failed++;
}
console.log(
  failed
    ? `\nframejs skill helper: ${failed}/${results.length} checks FAILED`
    : `\nframejs skill helper: all ${results.length} checks passed`,
);
process.exit(failed ? 1 : 0);
