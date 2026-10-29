import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { etagMatches } from "./etag.ts";
import {
  type FrameAssetDeps,
  frameAssetResponse,
  parseFrameAssetPath,
} from "./frame-asset.ts";
import { ExportError } from "./standalone-export.ts";

const SHA = "a".repeat(64);
const UUID = "019f29d555bb7e378869cdc5474baef1";
const DASHED = "019f29d5-55bb-7e37-8869-cdc5474baef1";
const CODE = `root.innerHTML = "x";\nexport const f = () => 1;`;
const IMMUTABLE = "public, max-age=31536000, immutable";

type Frame = { params: Record<string, unknown>; immutable: boolean };

const deps = (
  frames: Record<string, Frame>,
  over: Partial<FrameAssetDeps> = {},
): FrameAssetDeps & { loads: [string, string | undefined][] } => {
  const loads: [string, string | undefined][] = [];
  return {
    loads,
    publicOrigin: "https://framejs.io",
    s3Configured: true,
    loadFrameParams: (id, v) => {
      loads.push([id, v]);
      return Promise.resolve(frames[id] ?? null);
    },
    fetchText: () => Promise.resolve(CODE),
    isImmutableSourceUrl: (url) => url.startsWith("https://framejs.app/f/"),
    ...over,
  };
};

/** GET /j/<path>, e.g. `get("<sha>.esm.js", deps)`. */
const get = (
  path: string,
  d: FrameAssetDeps,
  headers: Record<string, string> = {},
  pinnedVersion?: string,
) => {
  const parsed = parseFrameAssetPath(path);
  if (!parsed) throw new Error(`not an asset path: ${path}`);
  return frameAssetResponse({
    ...parsed,
    pinnedVersion,
    header: (name) => headers[name.toLowerCase()],
  }, d);
};

const frame = (params: Record<string, unknown>, immutable = true) => ({
  params,
  immutable,
});

Deno.test("parseFrameAssetPath: the path grammar", () => {
  assertEquals(parseFrameAssetPath(`${SHA}.js`), {
    id: SHA,
    asset: { kind: "js" },
  });
  assertEquals(parseFrameAssetPath(`${DASHED}.esm.js`), {
    id: DASHED,
    asset: { kind: "esm" },
  });
  assertEquals(parseFrameAssetPath(`${UUID}.css`)?.asset, { kind: "css" });
  assertEquals(parseFrameAssetPath(`${UUID}.inputs.json`)?.asset, {
    kind: "param",
    param: "inputs",
  });
  // Not ours: the bare page, the whole-frame `.json` route, anything else.
  for (
    const other of [
      UUID,
      `${UUID}.json`,
      `${UUID}.html`,
      `.js`,
      `${UUID}.a.b.json`,
    ]
  ) {
    assertEquals(parseFrameAssetPath(other), null, other);
  }
});

Deno.test(".js is the code, unaltered", async () => {
  const res = await get(`${SHA}.js`, deps({ [SHA]: frame({ js: CODE }) }));
  assertEquals(res.status, 200);
  assertEquals(
    res.headers.get("content-type"),
    "text/javascript; charset=utf-8",
  );
  assertEquals(res.headers.get("x-content-type-options"), "nosniff");
  assertEquals(res.headers.get("cache-control"), IMMUTABLE);
  assertEquals(await res.text(), CODE);
});

Deno.test(".esm.js is the functions-only module", async () => {
  const res = await get(`${SHA}.esm.js`, deps({ [SHA]: frame({ js: CODE }) }));
  assertEquals(res.status, 200);
  assertEquals(
    res.headers.get("content-type"),
    "text/javascript; charset=utf-8",
  );
  const body = await res.text();
  assertStringIncludes(body, `// https://framejs.io/j/${SHA}.esm.js\n`);
  assertStringIncludes(body, "export const f = () => 1;");
  assertEquals(body.includes("root.innerHTML"), false);
});

Deno.test(".css is the css param; 404 without one", async () => {
  const d = deps({
    [SHA]: frame({ js: CODE, css: "body { color: red; }" }),
    [UUID]: frame({ js: CODE }),
  });
  const res = await get(`${SHA}.css`, d);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "text/css; charset=utf-8");
  assertEquals(await res.text(), "body { color: red; }");
  const none = await get(`${UUID}.css`, d);
  assertEquals(none.status, 404);
  assertEquals((await none.json()).error, "This frame has no `css`");
});

Deno.test(".<param>.json is any param as JSON; 404 without it", async () => {
  const inputs = { "data.json": { type: "json", value: [1, 2] } };
  const d = deps({
    [SHA]: frame({ js: CODE, inputs, state: { zoom: 2 }, bgColor: "#fff" }),
  });
  const res = await get(`${SHA}.inputs.json`, d);
  assertEquals(res.status, 200);
  assertEquals(
    res.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await res.json(), inputs);
  assertEquals(await (await get(`${SHA}.state.json`, d)).json(), { zoom: 2 });
  assertEquals(await (await get(`${SHA}.bgColor.json`, d)).json(), "#fff");
  assertEquals((await get(`${SHA}.og.json`, d)).status, 404);
});

// The service-worker refusal is a security boundary — `.js` is the frame's
// whole program. A shared cache that stored a 200 without this Vary could
// replay it to a registration.
Deno.test("every response varies on Service-Worker", async () => {
  const d = deps({
    [SHA]: frame({ js: CODE, inputs: {} }),
    [UUID]: frame({ js: CODE }, false),
  });
  for (
    const res of [
      await get(`${SHA}.js`, d),
      await get(`${SHA}.esm.js`, d),
      await get(`${SHA}.inputs.json`, d),
      await get(`${UUID}.js`, d),
      await get(`${SHA}.js`, d, { "service-worker": "script" }),
      await get("nope.js", d),
      await get(`${SHA}.css`, d),
    ]
  ) {
    assertEquals(res.headers.get("vary"), "Service-Worker");
  }
});

Deno.test("refuses a service-worker registration of any variant", async () => {
  const d = deps({ [SHA]: frame({ js: CODE }) });
  for (const ext of ["js", "esm.js", "css", "js.json"]) {
    const res = await get(`${SHA}.${ext}`, d, { "service-worker": "script" });
    assertEquals(res.status, 403, ext);
  }
  assertEquals(d.loads.length, 0);
});

Deno.test("live uuid: no-cache, ETag, 304 on revalidation", async () => {
  const d = deps({ [UUID]: frame({ js: CODE }, false) });
  const res = await get(`${DASHED}.js`, d);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("cache-control"), "no-cache");
  const etag = res.headers.get("etag")!;
  assertEquals(d.loads[0], [UUID, undefined]); // dashes normalized
  for (const inm of [etag, `W/${etag}`, `"other", ${etag}`]) {
    const again = await get(`${UUID}.js`, d, { "if-none-match": inm });
    assertEquals(again.status, 304, inm);
    assertEquals(again.headers.get("vary"), "Service-Worker");
  }
  assertEquals(
    (await get(`${UUID}.js`, d, { "if-none-match": '"x"' })).status,
    200,
  );
});

Deno.test("pinned uuid forwards the pin; a sha256 ignores one", async () => {
  const d = deps({ [UUID]: frame({ js: CODE }), [SHA]: frame({ js: CODE }) });
  const pinned = await get(`${UUID}.esm.js`, d, {}, "abc");
  assertEquals(d.loads[0], [UUID, "abc"]);
  assertEquals(pinned.headers.get("cache-control"), IMMUTABLE);
  assertStringIncludes(
    await pinned.text(),
    `// https://framejs.io/j/${UUID}.esm.js?v=abc\n`,
  );
  const sha = await get(`${SHA}.esm.js`, d, {}, "abc");
  assertEquals(d.loads[1], [SHA, undefined]);
  assertStringIncludes(
    await sha.text(),
    `// https://framejs.io/j/${SHA}.esm.js\n`,
  );
});

Deno.test("a URL-referenced js/css is fetched; immutable only from a content-addressed host", async () => {
  const fetched: string[] = [];
  const d = deps(
    {
      [SHA]: frame({ js: "https://framejs.app/f/abc" }),
      ["b".repeat(64)]: frame({
        js: "https://raw.githubusercontent.com/o/r/main/x.js",
        css: "https://cdn.example.com/style.css",
      }),
    },
    {
      fetchText: (url) => {
        fetched.push(url);
        return Promise.resolve(url.endsWith(".css") ? "p{}" : CODE);
      },
    },
  );
  const stable = await get(`${SHA}.js`, d);
  assertEquals(stable.headers.get("cache-control"), IMMUTABLE);
  assertEquals(await stable.text(), CODE);
  const mutable = await get(`${"b".repeat(64)}.js`, d);
  assertEquals(mutable.headers.get("cache-control"), "no-cache");
  assert(mutable.headers.get("etag"));
  const css = await get(`${"b".repeat(64)}.css`, d);
  assertEquals(await css.text(), "p{}");
  assertEquals(css.headers.get("cache-control"), "no-cache");
  assertEquals(fetched, [
    "https://framejs.app/f/abc",
    "https://raw.githubusercontent.com/o/r/main/x.js",
    "https://cdn.example.com/style.css",
  ]);
});

Deno.test("errors: 400, 503, 404, 422, and fetch failures", async () => {
  const d = deps({
    [UUID]: frame({ js: "   " }, false),
    [SHA]: frame({ js: "export function (" }),
  });
  assertEquals((await get("notanid.js", d)).status, 400);
  assertEquals((await get(`${"c".repeat(64)}.js`, d)).status, 404);
  assertEquals((await get(`${UUID}.js`, d)).status, 404); // no code
  assertEquals((await get(`${SHA}.esm.js`, d)).status, 422);
  // The raw code is served even when it does not parse: it is not ours to judge.
  assertEquals(await (await get(`${SHA}.js`, d)).text(), "export function (");
  assertEquals(
    (await get(`${SHA}.js`, deps({}, { s3Configured: false }))).status,
    503,
  );
  const hoisted = { [SHA]: frame({ js: "https://example.com/x.js" }) };
  assertEquals(
    (await get(
      `${SHA}.js`,
      deps(hoisted, {
        fetchText: () => Promise.reject(new ExportError("too big", 413)),
      }),
    )).status,
    413,
  );
  assertEquals(
    (await get(
      `${SHA}.js`,
      deps(hoisted, {
        fetchText: () => Promise.reject(new Error("boom")),
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
