import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import {
  brandingScript,
  extractBranding,
  pinnedBannerScript,
  pinnedVersionFromQuery,
  pinnedVersionSuffix,
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
// pinnedBannerScript — read-only banner with a "view latest" link
// ---------------------------------------------------------------------------

Deno.test("pinnedBannerScript marks it published, read-only, with the short hash", () => {
  const html = pinnedBannerScript(
    "12345678123442348234123456789abc",
    "abcdef1234567890",
  );
  assert(html.startsWith('<script id="pinned-banner">'));
  assertStringIncludes(html, "Published version");
  assertStringIncludes(html, "read-only");
  // Only the first 8 chars of the sha256 are shown.
  assertStringIncludes(html, "abcdef12");
  assertEquals(html.includes("abcdef1234567890"), false);
});

Deno.test("pinnedBannerScript links back to the current (latest) version", () => {
  const html = pinnedBannerScript(
    "12345678123442348234123456789abc",
    "abcdef1234567890",
  );
  // Wording matches the framejs.app page banner's back-link for a consistent
  // cross-app read-only experience.
  assertStringIncludes(html, "View latest version");
  // The link target is the unpinned /j/<uuid> path.
  assertStringIncludes(html, '"/j/12345678123442348234123456789abc"');
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
