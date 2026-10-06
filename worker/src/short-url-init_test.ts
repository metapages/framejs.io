import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import {
  frameOgPath,
  runtimeParamsPath,
  shortUrlInitScript,
} from "./short-url-init.ts";

const UUID = "01a0edf0-b07e-7e10-9222-f858ac01bba6";
const SHA256 = "a".repeat(64);
const ORIGIN = "https://framejs.app";

// ---------------------------------------------------------------------------
// runtimeParamsPath
// ---------------------------------------------------------------------------

Deno.test("runtimeParamsPath points at the runtime-params endpoint", () => {
  assertEquals(
    runtimeParamsPath(UUID),
    `/api/j/${UUID}/runtime-params`,
  );
});

Deno.test("runtimeParamsPath forwards a pin so the page renders that version", () => {
  assertEquals(
    runtimeParamsPath(UUID, "deadbeef"),
    `/api/j/${UUID}/runtime-params?v=deadbeef`,
  );
});

// ---------------------------------------------------------------------------
// shortUrlInitScript
//
// THE regression guard. The params used to be inlined into the HTML on the
// uuid path, which shipped a large frame's whole payload inside a
// `Cache-Control: no-cache` document on every load and every link unfurl.
// ---------------------------------------------------------------------------

Deno.test("the params are FETCHED, never inlined into the page", () => {
  const script = shortUrlInitScript(UUID, ORIGIN);

  // The payload must not appear in the HTML. (The catch branch assigns an
  // empty string deliberately — anything NON-empty is an inlined payload.)
  assert(
    !/__SHORT_URL_HASH_PARAMS\s*=\s*(["'])(?!\1)/.test(script),
    "hash params must not be inlined as a string literal in the page",
  );
  // ...it must be assigned from the fetch response instead.
  assertStringIncludes(script, "fetch(");
  assertStringIncludes(script, "window.__SHORT_URL_HASH_PARAMS=p");
});

Deno.test("__SHORT_URL_READY never rejects", () => {
  // index.html awaits this unguarded at the top of the runtime module, so a
  // rejection aborts the whole module and the page renders NOTHING — strictly
  // worse than a frame that fails to load. The catch is load-bearing.
  const script = shortUrlInitScript(UUID, ORIGIN);
  assertStringIncludes(script, ".catch(function(e)");
  assertStringIncludes(script, 'window.__SHORT_URL_HASH_PARAMS=""');
});

Deno.test("a non-2xx params response is treated as a failure, not as empty params", () => {
  // Without the r.ok check, a 404/502 body ("{\"error\":...}") would be handed
  // to the runtime as the frame's hash params.
  assertStringIncludes(shortUrlInitScript(UUID, ORIGIN), "if(!r.ok)throw");
});

Deno.test("the synchronous globals the edit hand-off needs stay inlined", () => {
  // onMenuClick reads these without awaiting anything.
  const script = shortUrlInitScript(UUID, ORIGIN, "deadbeef");
  assertStringIncludes(script, `window.__SHORT_URL_ID=${JSON.stringify(UUID)}`);
  assertStringIncludes(
    script,
    `window.__FRAMEJS_APP_ORIGIN=${JSON.stringify(ORIGIN)}`,
  );
  assertStringIncludes(script, 'window.__SHORT_URL_VERSION="deadbeef"');
});

Deno.test("an unpinned page reports a null version, not undefined", () => {
  // `undefined` would serialize to the bare token `undefined`; the runtime
  // checks this value, so it has to be valid JSON.
  assertStringIncludes(
    shortUrlInitScript(SHA256, ORIGIN),
    "window.__SHORT_URL_VERSION=null",
  );
});

Deno.test("both short-URL forms get the same script shape", () => {
  // The uuid and sha256 pages were two different bootstraps; unifying them is
  // the point. They should differ only in the id.
  const a = shortUrlInitScript(UUID, ORIGIN);
  const b = shortUrlInitScript(SHA256, ORIGIN);
  assertEquals(a.replaceAll(UUID, "<ID>"), b.replaceAll(SHA256, "<ID>"));
});

Deno.test("interpolated values are escaped for a <script> context", () => {
  // Ids reach here from the URL path. Nothing is concatenated in raw.
  const script = shortUrlInitScript('x"</script><script>alert(1)//', ORIGIN);
  assert(
    !script.includes("</script><script>"),
    "a quote/tag in the id must not break out of the script element",
  );
  assertEquals(
    script.match(/<\/script>/g)?.length,
    1,
    "exactly one closing script tag",
  );
});

// ---------------------------------------------------------------------------
// frameOgPath — a CROSS-REPO contract
//
// framejs.app serves this exact path from routes/j/[uuid]/og.json.ts. Nothing
// in either repo's type system connects the two, so if this string drifts the
// uuid page silently 404s (framejs.io treats a non-200 og response as "no such
// frame"). These cases are the only guard on that.
// ---------------------------------------------------------------------------

Deno.test("frameOgPath targets framejs.app's og.json route", () => {
  assertEquals(frameOgPath(UUID), `/j/${UUID}/og.json`);
});

Deno.test("frameOgPath forwards the pin", () => {
  // Without this a published page would render the LIVE version's og tags.
  assertEquals(frameOgPath(UUID, "deadbeef"), `/j/${UUID}/og.json?v=deadbeef`);
});

Deno.test("frameOgPath is og-only — never the full params endpoint", () => {
  // The whole point: a page request must not resolve the frame's content.
  const path = frameOgPath(UUID);
  assert(path.endsWith("/og.json"), "must address the og-only endpoint");
  assert(
    !/\/j\/[^/]+\.json$/.test(path),
    "must not be the full params endpoint (/j/<uuid>.json)",
  );
});
