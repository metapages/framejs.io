import { assertEquals, assertStringIncludes } from "@std/assert";
import { buildOgMetaTags, normalizeOgTags } from "./og.ts";

// Count the <meta> lines in the built block, ignoring the trailing empty split.
const metaLines = (html: string) =>
  html.split("\n").filter((line) => line.trim().length > 0);

// ---------------------------------------------------------------------------
// normalizeOgTags — og is user-supplied JSON, so anything can arrive here
// ---------------------------------------------------------------------------

Deno.test("normalizeOgTags keeps order and trims", () => {
  assertEquals(normalizeOgTags([" physics ", "canvas"]), [
    "physics",
    "canvas",
  ]);
});

Deno.test("normalizeOgTags drops empties and case-insensitive duplicates", () => {
  assertEquals(normalizeOgTags(["a", "", "  ", "A", "b", "a"]), ["a", "b"]);
});

Deno.test("normalizeOgTags ignores non-array and non-string values", () => {
  assertEquals(normalizeOgTags(undefined), []);
  assertEquals(normalizeOgTags("physics"), []);
  assertEquals(normalizeOgTags({ 0: "physics" }), []);
  assertEquals(normalizeOgTags([1, null, { a: 1 }, "ok"]), ["ok"]);
});

// ---------------------------------------------------------------------------
// buildOgMetaTags
// ---------------------------------------------------------------------------

Deno.test("buildOgMetaTags falls back when there is no og at all", () => {
  const html = buildOgMetaTags({});
  assertEquals(metaLines(html), [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="framejs.io" />`,
    `<meta property="og:description" content="" />`,
  ]);
});

// Regression: a frame carrying only tags (or only an image) used to skip the
// fallback branch entirely and render with no og:title at all.
Deno.test("buildOgMetaTags falls back per field, not per og object", () => {
  const title = `<meta property="og:title" content="framejs.io" />`;
  const empty = `<meta property="og:description" content="" />`;
  for (
    const og of [
      { tags: ["physics"] },
      { image: "https://example.com/i.png" },
      { description: "D" },
    ]
  ) {
    const lines = metaLines(buildOgMetaTags({ og }));
    assertEquals(lines[1], title, JSON.stringify(og));
    if (!("description" in og)) {
      assertEquals(lines[2], empty, JSON.stringify(og));
    }
  }
});

// article:tag is a property of the article vertical — every frame page must
// declare og:type=article for the tags to mean anything.
Deno.test("buildOgMetaTags always declares og:type=article", () => {
  const type = `<meta property="og:type" content="article" />`;
  assertEquals(metaLines(buildOgMetaTags({}))[0], type);
  assertEquals(metaLines(buildOgMetaTags({ og: { title: "T" } }))[0], type);
});

Deno.test("buildOgMetaTags emits one article:tag per tag, in order", () => {
  const html = buildOgMetaTags({
    og: { title: "T", tags: ["physics", "canvas", "animation"] },
  });
  assertEquals(metaLines(html), [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="T" />`,
    `<meta property="og:description" content="" />`,
    `<meta property="article:tag" content="physics" />`,
    `<meta property="article:tag" content="canvas" />`,
    `<meta property="article:tag" content="animation" />`,
  ]);
});

Deno.test("buildOgMetaTags renders tags even when they are the only og field", () => {
  const html = buildOgMetaTags({ og: { tags: ["physics"] } });
  assertEquals(metaLines(html), [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="framejs.io" />`,
    `<meta property="og:description" content="" />`,
    `<meta property="article:tag" content="physics" />`,
  ]);
});

Deno.test("buildOgMetaTags renders no article:tag for an all-blank tags array", () => {
  const html = buildOgMetaTags({ og: { tags: ["", "  "] } });
  assertEquals(html.includes("article:tag"), false);
  assertStringIncludes(html, `content="framejs.io"`);
});

Deno.test("buildOgMetaTags escapes tag values", () => {
  const html = buildOgMetaTags({
    og: { title: "T", tags: [`"><script>alert(1)</script>`] },
  });
  assertEquals(html.includes("<script>"), false);
  assertStringIncludes(
    html,
    `content="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"`,
  );
});

Deno.test("buildOgMetaTags still renders title/description/image", () => {
  const html = buildOgMetaTags({
    og: {
      title: "T",
      description: "D",
      image: "https://example.com/i.png",
      tags: ["x"],
    },
  });
  assertEquals(metaLines(html), [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="T" />`,
    `<meta property="og:description" content="D" />`,
    `<meta property="og:image" content="https://example.com/i.png" />`,
    `<meta property="article:tag" content="x" />`,
  ]);
});
