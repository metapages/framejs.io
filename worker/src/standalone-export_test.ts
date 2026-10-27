import { assert, assertEquals, assertRejects } from "@std/assert";

import {
  bundle,
  type FetchAsset,
  resolveWithImportMap,
} from "./standalone-bundle.ts";
import {
  assembleStandaloneHtml,
  buildStandaloneHtml,
  createPublicFetch,
  ExportError,
  inlineInputs,
  inlineModules,
  isFetchableUrl,
  toDataUrl,
  withBudget,
} from "./standalone-export.ts";

const enc = (s: string) => new TextEncoder().encode(s);

// A fake network: url -> [contentType, body]. Records every request.
const fakeFetch = (
  files: Record<string, [string, string]>,
): FetchAsset & { requested: string[] } => {
  const requested: string[] = [];
  const fn = (url: string) => {
    requested.push(url);
    const file = files[url];
    if (!file) return Promise.reject(new Error(`404 ${url}`));
    return Promise.resolve({
      url,
      bytes: enc(file[1]),
      contentType: file[0],
    });
  };
  return Object.assign(fn, { requested });
};

const JS = "application/javascript";

const decodeDataUrl = (dataUrl: string) => {
  const comma = dataUrl.indexOf(",");
  return {
    type: dataUrl.slice(5, comma).replace(/;base64$/, ""),
    text: new TextDecoder().decode(
      Uint8Array.from(atob(dataUrl.slice(comma + 1)), (c) => c.charCodeAt(0)),
    ),
  };
};

Deno.test("resolveWithImportMap: exact match, then longest prefix", () => {
  const map = {
    "three": "https://cdn/three.js",
    "three/": "https://cdn/three/",
    "three/addons/": "https://cdn/addons/",
  };
  assertEquals(resolveWithImportMap("three", map), "https://cdn/three.js");
  assertEquals(
    resolveWithImportMap("three/addons/x.js", map),
    "https://cdn/addons/x.js",
  );
  assertEquals(
    resolveWithImportMap("three/y.js", map),
    "https://cdn/three/y.js",
  );
  assertEquals(resolveWithImportMap("react", map), undefined);
});

Deno.test("bundle inlines https, absolute-path, relative and mapped imports", async () => {
  const fetchAsset = fakeFetch({
    "https://esm.sh/lib": [JS, 'export * from "/lib@1/es2022/lib.mjs";'],
    "https://esm.sh/lib@1/es2022/lib.mjs": [
      JS,
      'import { two } from "./two.mjs"; export const one = () => "ONE" + two;',
    ],
    "https://esm.sh/lib@1/es2022/two.mjs": [JS, 'export const two = "TWO";'],
    "https://cdn.example/mapped.js": [JS, 'export default "MAPPED";'],
  });
  const { code } = await bundle({
    contents:
      'import { one } from "https://esm.sh/lib";\nimport m from "mapped";\nexport const onInputs = () => one() + m;',
  }, { fetchAsset, importMap: { mapped: "https://cdn.example/mapped.js" } });

  // Only esbuild's provenance comments still name the urls.
  assert(!/^\s*(import|export \*)\b/m.test(code), code);
  assert(!/from\s*"https/.test(code), code);
  assert(
    code.includes('"ONE"') && code.includes('"TWO"') &&
      code.includes('"MAPPED"'),
  );
  assert(/export\s*\{[^}]*onInputs/.test(code), "exports are kept");
});

Deno.test("bundle fails clearly on an unmapped bare import", async () => {
  await assertRejects(
    () =>
      bundle({ contents: 'import x from "react"; x();' }, {
        fetchAsset: fakeFetch({}),
      }),
    Error,
    'Cannot resolve bare import "react"',
  );
});

Deno.test("bundle inlines a stylesheet's @import and url() assets", async () => {
  const fetchAsset = fakeFetch({
    "https://cdn.example/a.css": [
      "text/css",
      '@import "./b.css"; body { background: url(./bg.png); }',
    ],
    "https://cdn.example/b.css": ["text/css", "p { color: red; }"],
    "https://cdn.example/bg.png": ["image/png", "PNGBYTES"],
  });
  const { code, loader } = await bundle({ url: "https://cdn.example/a.css" }, {
    fetchAsset,
  });
  assertEquals(loader, "css");
  assert(code.includes("color: red"), code);
  assert(code.includes("url(data:image/png"), code);
  assert(!code.includes("bg.png"), code);
});

Deno.test("inlineInputs replaces url/x-uri/key datarefs with data urls", async () => {
  const fetchAsset = fakeFetch({
    "https://files.example/data.json": ["application/json", '{"a":1}'],
    "https://framejs.io/f/abc": ["text/csv", "x,y\n1,2"],
    "https://files.example/uri.txt": ["text/plain", "hello"],
    "https://container.mtfm.io/download/k1": [
      "application/json",
      '{"url":"https://files.example/k1.bin"}',
    ],
    "https://files.example/k1.bin": ["application/octet-stream", "BIN"],
  });
  const out = await inlineInputs({
    plain: { a: 1 },
    text: "just a string",
    json: { type: "url", value: "https://files.example/data.json" },
    relative: { type: "url", value: "/f/abc" },
    uri: "data:text/x-uri;charset=utf-8," +
      encodeURIComponent("https://files.example/uri.txt"),
    key: { type: "key", value: "k1" },
    already: { type: "url", value: "data:text/plain;base64,aGk=" },
  }, { fetchAsset, origin: "https://framejs.io" });

  assertEquals(out.plain, { a: 1 });
  assertEquals(out.text, "just a string");
  assertEquals(out.already, {
    type: "url",
    value: "data:text/plain;base64,aGk=",
  });
  const json = out.json as { type: string; value: string };
  assertEquals(json.type, "url");
  assertEquals(decodeDataUrl(json.value), {
    type: "application/json",
    text: '{"a":1}',
  });
  assertEquals(
    decodeDataUrl((out.relative as { value: string }).value).text,
    "x,y\n1,2",
  );
  assertEquals(decodeDataUrl((out.uri as { value: string }).value), {
    type: "text/plain",
    text: "hello",
  });
  assertEquals(decodeDataUrl((out.key as { value: string }).value).text, "BIN");
});

Deno.test("inlineInputs names the input that could not be fetched", async () => {
  const error = await assertRejects(
    () =>
      inlineInputs({ big: { type: "url", value: "https://gone.example/x" } }, {
        fetchAsset: fakeFetch({}),
        origin: "https://framejs.io",
      }),
    ExportError,
  );
  assert(error.message.includes('Input "big"'), error.message);
});

Deno.test("inlineModules inlines css and scripts, applies and drops the import map", async () => {
  const fetchAsset = fakeFetch({
    "https://cdn.example/style.css": ["text/css", "h1 { color: blue; }"],
    "https://cdn.example/classic.js": [JS, "window.CLASSIC = 1;"],
    "https://cdn.example/mod.js": [JS, 'import v from "dep"; window.MOD = v;'],
    "https://cdn.example/dep.js": [JS, "export default 42;"],
  });
  const importMap = JSON.stringify({
    imports: { dep: "https://cdn.example/dep.js" },
  });
  const { modules, importMap: map } = await inlineModules([
    importMap,
    "https://cdn.example/style.css",
    "https://cdn.example/classic.js",
    '<script type="module" src="https://cdn.example/mod.js"></script>',
    '<link rel="preconnect" href="https://fonts.example">',
  ], { fetchAsset, origin: "https://framejs.io" });

  assertEquals(map, { dep: "https://cdn.example/dep.js" });
  assertEquals(modules.length, 3);
  assert(
    modules[0].startsWith('<link rel="stylesheet" href="data:text/css;base64,'),
  );
  assertEquals(decodeDataUrl(modules[1]).text, "window.CLASSIC = 1;");
  const moduleSrc = /src="([^"]+)"/.exec(modules[2])![1];
  assert(modules[2].startsWith('<script type="module" src="data:'));
  const moduleCode = decodeDataUrl(moduleSrc).text;
  assert(moduleCode.includes("42") && !/from\s*"/.test(moduleCode), moduleCode);
  assert(!fetchAsset.requested.some((u) => u.includes("fonts.example")));
});

Deno.test("isFetchableUrl refuses the server's own network", () => {
  for (
    const url of [
      "http://localhost:3000/x",
      "https://framejs-io.localhost/x",
      "http://seaweedfs:8888/buckets",
      "http://127.0.0.1/x",
      "http://10.0.0.5/x",
      "http://192.168.1.1/x",
      "http://172.20.0.2/x",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]/x",
      "file:///etc/passwd",
      "not a url",
    ]
  ) {
    assertEquals(isFetchableUrl(url), false, url);
  }
  for (
    const url of [
      "https://esm.sh/d3",
      "https://cdn.jsdelivr.net/npm/x",
      "http://example.com/a.js",
      "https://8.8.8.8/x",
    ]
  ) {
    assertEquals(isFetchableUrl(url), true, url);
  }
});

Deno.test("createPublicFetch will not follow a redirect inward", async () => {
  const fetchImpl = ((url: string) =>
    Promise.resolve(
      url === "https://public.example/x"
        ? new Response(null, {
          status: 302,
          headers: { location: "http://127.0.0.1/secret" },
        })
        : new Response("secret"),
    )) as unknown as typeof fetch;
  await assertRejects(
    () => createPublicFetch(fetchImpl)("https://public.example/x"),
    ExportError,
    "Refusing to fetch http://127.0.0.1/secret",
  );
});

Deno.test("withBudget fetches each url once and enforces the size limit", async () => {
  const fetchAsset = fakeFetch({ "https://a/x": [JS, "12345"] });
  const budgeted = withBudget(fetchAsset, 8);
  await budgeted("https://a/x");
  await budgeted("https://a/x");
  assertEquals(fetchAsset.requested.length, 1);

  const tight = withBudget(fakeFetch({ "https://a/x": [JS, "12345"] }), 4);
  const error = await assertRejects(() => tight("https://a/x"), ExportError);
  assertEquals(error.status, 413);
});

Deno.test("toDataUrl round-trips bytes", () => {
  assertEquals(
    decodeDataUrl(toDataUrl(enc("é<>"), "text/plain")).text,
    "é<>",
  );
});

Deno.test("assembleStandaloneHtml on the real runtime: head stripped, body untouched", async () => {
  const runtimeHtml = await Deno.readTextFile(
    new URL("../index.html", import.meta.url),
  );
  const hashParams = "?js=</script><script>alert(1)</script>";
  const html = assembleStandaloneHtml({
    runtimeHtml,
    hashParams,
    title: "My <frame>",
    faviconSvg: "<svg/>",
    original: { js: "x" },
  });
  const [head, body] = html.split("</head>");
  const [, runtimeBody] = runtimeHtml.split("</head>");
  assertEquals(body, runtimeBody, "only the head is rewritten");
  // The one remaining <link> is the inline favicon.
  const links = head.match(/<link\b[^>]*>/g) ?? [];
  assertEquals(links.length, 1);
  assert(links[0]!.includes('href="data:image/svg+xml;base64,'));
  assert(!head.includes("OG_START"));
  assert(head.includes("<title>My &lt;frame&gt;</title>"));
  assert(head.includes('window.__SHORT_URL_ID="standalone"'));
  // The payload cannot close its <script>.
  assert(!head.includes("</script><script>alert(1)"));
  assert(
    head.includes(
      JSON.stringify(hashParams).replace(/</g, "\\u003C").replace(
        />/g,
        "\\u003E",
      ),
    ),
  );
  assert(head.includes('id="framejs-original"'));
});

Deno.test("buildStandaloneHtml: no network imports remain anywhere", async () => {
  const fetchAsset = fakeFetch({
    "https://cdn.example/runtime-lib.js": [JS, "export const lib = 1;"],
    "https://esm.sh/thing": [JS, 'export const thing = "THING";'],
    "https://files.example/in.json": ["application/json", "[1,2]"],
  });
  const runtimeHtml = `<html><head><title>x</title>
<link rel="icon" href="/favicon.ico" />
</head><body><script type="module">
import { lib } from "https://cdn.example/runtime-lib.js";
const s = "<link";
</script></body></html>`;
  let encoded: Record<string, unknown> = {};
  const html = await buildStandaloneHtml({
    params: {
      js:
        'import { thing } from "https://esm.sh/thing";\nroot.innerText = thing;',
      inputs: {
        "in.json": { type: "url", value: "https://files.example/in.json" },
      },
      edit: true,
      og: { title: "Exported" },
    },
    runtimeHtml,
    origin: "https://framejs.io",
    fetchAsset,
    encodeHashParams: (p) => {
      encoded = p;
      return "?encoded";
    },
  });
  assertEquals(encoded.hm, "disabled");
  assertEquals(encoded.edit, undefined);
  assert(!/from\s*"https/.test(String(encoded.js)));
  assert(String(encoded.js).includes('"THING"'));
  assert(
    String(
      (encoded.inputs as Record<string, { value: string }>)["in.json"].value,
    )
      .startsWith("data:application/json;base64,"),
  );
  assert(!html.includes('from "https://'), "runtime imports inlined");
  assert(html.includes('const s = "<link";'), "body strings untouched");
  assert(!html.includes("/favicon.ico"));
  assert(html.includes("<title>Exported</title>"));
  // The original, readable source rides along.
  assert(html.includes("https://esm.sh/thing"));
});

Deno.test("buildStandaloneHtml refuses a frame with no code", async () => {
  const error = await assertRejects(
    () =>
      buildStandaloneHtml({
        params: { js: "  " },
        runtimeHtml: "<head></head>",
        origin: "https://framejs.io",
        fetchAsset: fakeFetch({}),
        encodeHashParams: () => "",
      }),
    ExportError,
  );
  assertEquals(error.status, 400);
});
