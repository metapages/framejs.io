import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import {
  brandingScript,
  extractBranding,
  pinnedVersionFromQuery,
  pinnedVersionSuffix,
  runtimeHashParams,
} from "./pinned-version.ts";

// Build a query lookup from a plain object, mimicking Hono's c.req.query(key).
const q = (params: Record<string, string>) => (key: string) => params[key];

// ---------------------------------------------------------------------------
// pinnedVersionFromQuery — ?v= canonical, ?sha256= legacy alias
// ---------------------------------------------------------------------------

Deno.test("pinnedVersionFromQuery reads the canonical ?v=", () => {
  assertEquals(pinnedVersionFromQuery(q({ v: "abc123" })), "abc123");
});

Deno.test("pinnedVersionFromQuery accepts the legacy ?sha256= alias", () => {
  assertEquals(pinnedVersionFromQuery(q({ sha256: "def456" })), "def456");
});

Deno.test("pinnedVersionFromQuery prefers ?v= when both are present", () => {
  assertEquals(
    pinnedVersionFromQuery(q({ v: "wins", sha256: "loses" })),
    "wins",
  );
});

Deno.test("pinnedVersionFromQuery is undefined when unpinned", () => {
  assertEquals(pinnedVersionFromQuery(q({})), undefined);
});

// ---------------------------------------------------------------------------
// pinnedVersionSuffix — upstream/favicon query suffix
// ---------------------------------------------------------------------------

Deno.test("pinnedVersionSuffix builds ?v= for a pin", () => {
  assertEquals(pinnedVersionSuffix("abc123"), "?v=abc123");
});

Deno.test("pinnedVersionSuffix is empty when unpinned", () => {
  assertEquals(pinnedVersionSuffix(undefined), "");
});

Deno.test("pinnedVersionSuffix url-encodes the version", () => {
  assertEquals(pinnedVersionSuffix("a b/c"), "?v=a%20b%2Fc");
});

// ---------------------------------------------------------------------------
// extractBranding — split the reserved LIVE-only `branding` field
// ---------------------------------------------------------------------------

Deno.test("extractBranding pulls branding out and deletes it from the json", () => {
  const json: Record<string, unknown> = {
    js: "console.log(1)",
    branding: "<div>Made with framejs</div>",
  };
  assertEquals(extractBranding(json), "<div>Made with framejs</div>");
  // The branding key must NOT survive into the encoded hash params.
  assertEquals("branding" in json, false);
  assertEquals(json.js, "console.log(1)");
});

Deno.test("extractBranding returns undefined when absent (Pro / pinned version)", () => {
  const json: Record<string, unknown> = { js: "console.log(1)" };
  assertEquals(extractBranding(json), undefined);
  assertEquals(json.js, "console.log(1)");
});

Deno.test("extractBranding ignores a non-string branding value", () => {
  const json: Record<string, unknown> = { branding: 42 };
  assertEquals(extractBranding(json), undefined);
  assertEquals("branding" in json, false);
});

// ---------------------------------------------------------------------------
// runtimeHashParams — drop `edit`, mark a pin read-only
// ---------------------------------------------------------------------------

Deno.test("runtimeHashParams drops edit so a load can't enter edit mode", () => {
  assertEquals(
    runtimeHashParams("?js=abc&edit=true&inputs=xyz"),
    "?js=abc&inputs=xyz",
  );
});

Deno.test("runtimeHashParams leaves an unpinned frame editable", () => {
  assertEquals(runtimeHashParams("?js=abc"), "?js=abc");
  assertEquals(runtimeHashParams("?js=abc").includes("readonly"), false);
});

Deno.test("runtimeHashParams marks a pinned version read-only", () => {
  assertEquals(
    runtimeHashParams("?js=abc", "a".repeat(64)),
    "?js=abc&readonly=true",
  );
});

Deno.test("runtimeHashParams ignores an inbound readonly — the pin decides", () => {
  // A stored frame carrying readonly=true must not lock the LIVE view...
  assertEquals(runtimeHashParams("?js=abc&readonly=true"), "?js=abc");
  // ...and must not double up on a pinned one.
  assertEquals(
    runtimeHashParams("?readonly=true&js=abc", "b".repeat(64)),
    "?js=abc&readonly=true",
  );
});

Deno.test("runtimeHashParams is empty when nothing survives", () => {
  assertEquals(runtimeHashParams(""), "");
  assertEquals(runtimeHashParams("?edit=true"), "");
  assertEquals(
    runtimeHashParams("?edit=true", "c".repeat(64)),
    "?readonly=true",
  );
});

// ---------------------------------------------------------------------------
// brandingScript — inject the LIVE-version overlay after #root
// ---------------------------------------------------------------------------

Deno.test("brandingScript embeds the overlay html and targets #root", () => {
  const html = brandingScript(
    "<a href='https://framejs.app'>Made with framejs</a>",
  );
  assert(html.startsWith('<script id="framejs-branding">'));
  assertStringIncludes(html, "getElementById('root')");
  // The overlay markup is JSON-embedded so quotes are safely escaped.
  assertStringIncludes(
    html,
    JSON.stringify("<a href='https://framejs.app'>Made with framejs</a>"),
  );
});
