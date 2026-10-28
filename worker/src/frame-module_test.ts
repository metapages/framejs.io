import { assertEquals, assertStringIncludes } from "@std/assert";
import { etagMatches } from "./etag.ts";
import { type FrameModuleDeps, frameModuleResponse } from "./frame-module.ts";
import { ExportError } from "./standalone-export.ts";

const SHA = "a".repeat(64);
const UUID = "019f29d555bb7e378869cdc5474baef1";
const DASHED = "019f29d5-55bb-7e37-8869-cdc5474baef1";
const CODE = `root.innerHTML = "x";\nexport const f = () => 1;`;

type Frame = { js: string; immutable: boolean };

const deps = (
  frames: Record<string, Frame>,
  over: Partial<FrameModuleDeps> = {},
): FrameModuleDeps & { loads: [string, string | undefined][] } => {
  const loads: [string, string | undefined][] = [];
  return {
    loads,
    publicOrigin: "https://framejs.io",
    s3Configured: true,
    loadFrameJs: (id, v) => {
      loads.push([id, v]);
      return Promise.resolve(frames[id] ?? null);
    },
    fetchSource: () => Promise.resolve(CODE),
    isImmutableSourceUrl: (url) => url.startsWith("https://framejs.app/f/"),
    ...over,
  };
};

const get = (
  id: string,
  d: FrameModuleDeps,
  headers: Record<string, string> = {},
  pinnedVersion?: string,
) =>
  frameModuleResponse({
    id,
    pinnedVersion,
    header: (name) => headers[name.toLowerCase()],
  }, d);

Deno.test("serves an immutable sha256 module", async () => {
  const res = await get(SHA, deps({ [SHA]: { js: CODE, immutable: true } }));
  assertEquals(res.status, 200);
  assertEquals(
    res.headers.get("content-type"),
    "text/javascript; charset=utf-8",
  );
  assertEquals(res.headers.get("x-content-type-options"), "nosniff");
  assertEquals(
    res.headers.get("cache-control"),
    "public, max-age=31536000, immutable",
  );
  const body = await res.text();
  assertStringIncludes(body, "export const f = () => 1;");
  assertEquals(body.includes("root.innerHTML"), false);
});

// The service-worker refusal is a security boundary: a shared cache that
// stored a 200 without this Vary could replay it to a registration.
Deno.test("every response varies on Service-Worker", async () => {
  const d = deps({
    [SHA]: { js: CODE, immutable: true },
    [UUID]: { js: CODE, immutable: false },
  });
  for (
    const res of [
      await get(SHA, d),
      await get(UUID, d),
      await get(SHA, d, { "service-worker": "script" }),
      await get("nope", d),
    ]
  ) {
    assertEquals(res.headers.get("vary"), "Service-Worker");
  }
});

Deno.test("refuses a service-worker registration", async () => {
  const d = deps({ [SHA]: { js: CODE, immutable: true } });
  const res = await get(SHA, d, { "service-worker": "script" });
  assertEquals(res.status, 403);
  assertEquals(d.loads.length, 0);
});

Deno.test("live uuid: no-cache, ETag, 304 on revalidation", async () => {
  const d = deps({ [UUID]: { js: CODE, immutable: false } });
  const res = await get(DASHED, d);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("cache-control"), "no-cache");
  const etag = res.headers.get("etag")!;
  assertEquals(d.loads[0], [UUID, undefined]); // dashes normalized
  for (const inm of [etag, `W/${etag}`, `"other", ${etag}`]) {
    const again = await get(UUID, d, { "if-none-match": inm });
    assertEquals(again.status, 304, inm);
    assertEquals(again.headers.get("vary"), "Service-Worker");
  }
  assertEquals((await get(UUID, d, { "if-none-match": '"x"' })).status, 200);
});

Deno.test("pinned uuid forwards the pin; a sha256 ignores one", async () => {
  const d = deps({
    [UUID]: { js: CODE, immutable: true },
    [SHA]: { js: CODE, immutable: true },
  });
  const pinned = await get(UUID, d, {}, "abc");
  assertEquals(d.loads[0], [UUID, "abc"]);
  assertStringIncludes(
    await pinned.text(),
    `// https://framejs.io/j/${UUID}.js?v=abc\n`,
  );
  const sha = await get(SHA, d, {}, "abc");
  assertEquals(d.loads[1], [SHA, undefined]);
  assertStringIncludes(await sha.text(), `// https://framejs.io/j/${SHA}.js\n`);
});

Deno.test("hoisted source: immutable only from a content-addressed host", async () => {
  const fetched: string[] = [];
  const d = deps(
    {
      [SHA]: { js: "https://framejs.app/f/abc", immutable: true },
      ["b".repeat(64)]: {
        js: "https://raw.githubusercontent.com/o/r/main/x.js",
        immutable: true,
      },
    },
    {
      fetchSource: (url) => {
        fetched.push(url);
        return Promise.resolve(CODE);
      },
    },
  );
  const stable = await get(SHA, d);
  assertEquals(
    stable.headers.get("cache-control"),
    "public, max-age=31536000, immutable",
  );
  assertStringIncludes(await stable.text(), "export const f");
  const mutable = await get("b".repeat(64), d);
  assertEquals(mutable.headers.get("cache-control"), "no-cache");
  assertEquals(typeof mutable.headers.get("etag"), "string");
  assertEquals(fetched, [
    "https://framejs.app/f/abc",
    "https://raw.githubusercontent.com/o/r/main/x.js",
  ]);
});

Deno.test("errors: 400, 503, 404, 422, and fetch failures", async () => {
  const d = deps({
    [UUID]: { js: "   ", immutable: false },
    [SHA]: { js: "export function (", immutable: true },
  });
  assertEquals((await get("notanid", d)).status, 400);
  assertEquals((await get("c".repeat(64), d)).status, 404);
  assertEquals((await get(UUID, d)).status, 404); // no code
  assertEquals((await get(SHA, d)).status, 422);
  assertEquals(
    (await get(SHA, deps({}, { s3Configured: false }))).status,
    503,
  );
  const hoisted = {
    [SHA]: { js: "https://example.com/x.js", immutable: true },
  };
  assertEquals(
    (await get(
      SHA,
      deps(hoisted, {
        fetchSource: () => Promise.reject(new ExportError("too big", 413)),
      }),
    )).status,
    413,
  );
  assertEquals(
    (await get(
      SHA,
      deps(hoisted, {
        fetchSource: () => Promise.reject(new Error("boom")),
      }),
    )).status,
    502,
  );
});

Deno.test("etagMatches: lists, weak tags, wildcard", () => {
  assertEquals(etagMatches(undefined, '"a"'), false);
  assertEquals(etagMatches('"a"', '"a"'), true);
  assertEquals(etagMatches('W/"a"', '"a"'), true);
  assertEquals(etagMatches('"b" , "a"', '"a"'), true);
  assertEquals(etagMatches("*", '"a"'), true);
  assertEquals(etagMatches('"b"', '"a"'), false);
});
