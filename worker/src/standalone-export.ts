// Standalone HTML export: one frame, with its runtime, code, modules and
// inputs all baked into a single .html file that makes no network requests to
// run (requests the frame's own code makes at run time are its business).
//
// The file is this worker's own runtime (index.html) in "short URL mode": the
// frame's hash params are inlined into window.__SHORT_URL_HASH_PARAMS, exactly
// as a /j/<id> page receives them, so the runtime needs no changes to run it.
// What changes is that everything those params point at is pulled inside:
//
//   - `js`: bundled with every import it makes (standalone-bundle.ts). A `js`
//     that is a URL to the source is fetched first.
//   - `modules`: stylesheets and module scripts are bundled, classic scripts
//     fetched, each into a data: URL. An import map is applied while bundling
//     and then dropped — there is nothing left for it to map.
//   - `inputs`: `url` and `key` datarefs are fetched and replaced by a `url`
//     dataref whose value is a data: URL. The runtime resolves those with
//     fetch(), which serves a data: URL locally, with the same content type —
//     so the frame's onInputs sees exactly what it saw before.
//   - the runtime's own CDN imports (hash-query, metapage) are bundled into
//     data: URLs, and every <link> (favicons, manifest) is dropped.
//
// The menu button is disabled (`hm=disabled`): the editor is a separate app
// that cannot travel inside the file. The original, un-bundled source, modules
// and inputs ride along in <script id="framejs-original"> so the export stays
// readable and re-importable long after the CDNs it came from are gone.

import { encodeBase64 } from "@std/encoding/base64";

import {
  bundle,
  type FetchAsset,
  type FetchedAsset,
  type ImportMapImports,
} from "./standalone-bundle.ts";
import { jsonForScript } from "./short-url-init.ts";

/** A failure the user can act on: its message is shown to them. */
export class ExportError extends Error {
  constructor(message: string, readonly status: 400 | 413 | 422 = 422) {
    super(message);
    this.name = "ExportError";
  }
}

/** Version of the export format, recorded in the file. */
export const STANDALONE_FORMAT_VERSION = 1;

export const toDataUrl = (bytes: Uint8Array, contentType: string): string =>
  `data:${contentType || "application/octet-stream"};base64,${
    encodeBase64(bytes)
  }`;

const textDataUrl = (text: string, contentType: string): string =>
  toDataUrl(new TextEncoder().encode(text), contentType);

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

const PRIVATE_IPV4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

/**
 * Whether the server may fetch `url` on a user's behalf. The export fetches
 * URLs the user chose, so it must not become a way to read the server's own
 * network: only http(s), and never a loopback/private address or a bare
 * internal hostname (a docker service name like `seaweedfs`).
 */
export const isFetchableUrl = (url: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") && !host.startsWith("[")) return false;
  if (
    host === "localhost" || host.endsWith(".localhost") ||
    host.endsWith(".internal") || host.endsWith(".local")
  ) {
    return false;
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return !PRIVATE_IPV4.some((re) => re.test(host));
  }
  if (host.startsWith("[")) {
    const v6 = host.slice(1, -1);
    return !(v6 === "::1" || v6 === "::" || /^f[cd]/.test(v6) ||
      /^fe[89ab]/.test(v6) || v6.startsWith("::ffff:"));
  }
  return true;
};

/**
 * A FetchAsset over the public internet: refuses non-fetchable URLs (also on
 * every redirect hop, so a redirect cannot bounce it inward), times out, and
 * refuses non-2xx responses.
 */
export const createPublicFetch = (
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 60_000,
): FetchAsset =>
async (url) => {
  let current = url;
  for (let hop = 0; hop < 10; hop++) {
    if (!isFetchableUrl(current)) {
      throw new ExportError(`Refusing to fetch ${current}`);
    }
    const response = await fetchImpl(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) break;
      current = new URL(location, current).href;
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new ExportError(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
      );
    }
    return {
      url: current,
      bytes: new Uint8Array(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") ||
        "application/octet-stream",
    };
  }
  throw new ExportError(`Too many redirects fetching ${url}`);
};

/**
 * Wraps a FetchAsset so one export fetches each URL once, and fails as soon as
 * the total it has pulled in passes `maxBytes`.
 */
export const withBudget = (
  fetchAsset: FetchAsset,
  maxBytes: number,
): FetchAsset => {
  const seen = new Map<string, Promise<FetchedAsset>>();
  let total = 0;
  return (url) => {
    let pending = seen.get(url);
    if (!pending) {
      pending = fetchAsset(url).then((asset) => {
        total += asset.bytes.byteLength;
        if (total > maxBytes) {
          throw new ExportError(
            `The export is larger than the ${
              Math.round(maxBytes / 1024 / 1024)
            }MB limit`,
            413,
          );
        }
        return asset;
      });
      seen.set(url, pending);
    }
    return pending;
  };
};

// ---------------------------------------------------------------------------
// js
// ---------------------------------------------------------------------------

// Same test as the runtime's isJsSourceUrl (worker/index.html).
const isSourceUrl = (value: string) => {
  const trimmed = value.trim();
  return /^https?:\/\/\S+$/.test(trimmed);
};

/** The frame's source, fetched when `js` is a URL referencing it. */
export async function resolveJsSource(
  js: string,
  fetchAsset: FetchAsset,
): Promise<string> {
  if (!isSourceUrl(js)) return js;
  const asset = await fetchAsset(js.trim());
  return new TextDecoder().decode(asset.bytes);
}

const describe = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// ---------------------------------------------------------------------------
// modules
// ---------------------------------------------------------------------------

const attr = (tag: string, name: string) =>
  new RegExp(`<\\w+\\s+.*${name}="([^"]*)"`).exec(tag)?.[1];

/**
 * Inlines a `modules` hash param. Returns the rewritten list and the import
 * map (the first one, as the runtime only honours the first) to bundle with.
 */
export async function inlineModules(
  modules: string[],
  options: { fetchAsset: FetchAsset; origin: string },
): Promise<{ modules: string[]; importMap: ImportMapImports }> {
  const { fetchAsset, origin } = options;
  let importMap: ImportMapImports | undefined;
  const rest: string[] = [];
  for (const entry of modules) {
    if (typeof entry !== "string") continue;
    if (entry.startsWith("{")) {
      try {
        const parsed = JSON.parse(decodeURIComponent(entry));
        if (parsed?.imports && !importMap) {
          importMap = parsed.imports;
          continue;
        }
      } catch {
        // not an import map: fall through and keep it as it was
      }
      if (importMap) continue;
    }
    rest.push(entry);
  }
  importMap ??= {};
  // An import map's targets may be relative to the page.
  for (const [key, value] of Object.entries(importMap)) {
    importMap[key] = new URL(value, origin + "/").href;
  }

  const absolute = (url: string) => new URL(url, origin + "/").href;
  const bundleCss = async (url: string) =>
    textDataUrl(
      (await bundle({ url: absolute(url) }, { fetchAsset, importMap })).code,
      "text/css",
    );

  const out: string[] = [];
  for (const entry of rest) {
    const trimmed = entry.trim();
    try {
      if (trimmed.endsWith(".css")) {
        out.push(`<link rel="stylesheet" href="${await bundleCss(trimmed)}">`);
      } else if (trimmed.startsWith("<link")) {
        const href = attr(trimmed, "href");
        const rel = attr(trimmed, "rel");
        // Only a stylesheet does anything for the page; preconnect, icon,
        // preload and friends would only make requests.
        if (href && (rel ?? "stylesheet") === "stylesheet") {
          out.push(`<link rel="stylesheet" href="${await bundleCss(href)}">`);
        }
      } else if (trimmed.startsWith("<script")) {
        const src = attr(trimmed, "src");
        const type = attr(trimmed, "type");
        if (!src) {
          out.push(entry);
        } else if (type === "module") {
          const { code } = await bundle({ url: absolute(src) }, {
            fetchAsset,
            importMap,
          });
          out.push(
            `<script type="module" src="${
              textDataUrl(code, "text/javascript")
            }"></script>`,
          );
        } else {
          const asset = await fetchAsset(absolute(src));
          out.push(
            `<script${type ? ` type="${type}"` : ""} src="${
              toDataUrl(asset.bytes, "text/javascript")
            }"></script>`,
          );
        }
      } else if (trimmed) {
        // A bare URL is loaded as a classic script.
        const asset = await fetchAsset(absolute(trimmed));
        out.push(toDataUrl(asset.bytes, "text/javascript"));
      }
    } catch (error) {
      if (error instanceof ExportError && error.status === 413) throw error;
      throw new ExportError(`Module ${trimmed}: ${describe(error)}`);
    }
  }
  return { modules: out, importMap };
}

// ---------------------------------------------------------------------------
// inputs
// ---------------------------------------------------------------------------

// Mirrors the runtime's urlDataUrlToUrl (worker/index.html).
const urlFromUriDataUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !value.startsWith("data:")) return undefined;
  const comma = value.indexOf(",");
  if (comma === -1) return undefined;
  const mime = value.substring("data:".length, comma).split(";")[0];
  if (mime !== "text/x-uri") return undefined;
  return decodeURIComponent(value.substring(comma + 1));
};

const CONTAINER_ADDRESS = "https://container.mtfm.io";

/**
 * Inlines the `inputs` hash param: every top-level value the runtime would
 * fetch (a `url` or `key` dataref, or a text/x-uri data URL) becomes a `url`
 * dataref holding a data: URL of the same bytes and content type. Everything
 * else is already inline and is kept as it is.
 */
export async function inlineInputs(
  inputs: Record<string, unknown>,
  options: { fetchAsset: FetchAsset; origin: string },
): Promise<Record<string, unknown>> {
  const { fetchAsset, origin } = options;
  const out: Record<string, unknown> = {};
  for (const [key, original] of Object.entries(inputs)) {
    let value = original;
    const uri = urlFromUriDataUrl(value) ??
      urlFromUriDataUrl((value as { value?: unknown } | null)?.value);
    if (uri) {
      value = {
        ...(typeof value === "object" ? value : {}),
        type: "url",
        value: uri,
      };
    }
    const ref = value as { type?: unknown; value?: unknown } | null;
    try {
      if (
        ref && typeof ref === "object" && typeof ref.value === "string" &&
        ref.type === "url" && !ref.value.startsWith("data:")
      ) {
        const asset = await fetchAsset(new URL(ref.value, origin + "/").href);
        value = { ...ref, value: toDataUrl(asset.bytes, asset.contentType) };
      } else if (
        ref && typeof ref === "object" && typeof ref.value === "string" &&
        ref.type === "key"
      ) {
        const pointer = await fetchAsset(
          `${CONTAINER_ADDRESS}/download/${encodeURIComponent(ref.value)}`,
        );
        const { url } = JSON.parse(new TextDecoder().decode(pointer.bytes));
        const asset = await fetchAsset(url);
        value = {
          type: "url",
          value: toDataUrl(asset.bytes, asset.contentType),
        };
      }
    } catch (error) {
      if (error instanceof ExportError && error.status === 413) throw error;
      throw new ExportError(`Input "${key}": ${describe(error)}`);
    }
    out[key] = value;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

// The runtime's own imports are pinned versions, so their bundles never change:
// keep them for the life of the isolate.
const runtimeModuleCache = new Map<string, Promise<string>>();

/**
 * index.html with each `https://` module it imports replaced by a data: URL of
 * that module, bundled.
 */
export async function inlineRuntimeImports(
  html: string,
  fetchAsset: FetchAsset,
): Promise<string> {
  const urls = new Set<string>();
  // Statements only: a line that starts `import …` or closes a multi-line
  // import with `} from`. Not ` * import … from "…"` in a doc comment.
  const importStatement =
    /^[ \t]*(?:import\b[^"\n]*|\})[ \t]*from[ \t]+"(https:\/\/[^"]+)"/gm;
  for (const match of html.matchAll(importStatement)) {
    urls.add(match[1]);
  }
  for (const url of urls) {
    let pending = runtimeModuleCache.get(url);
    if (!pending) {
      pending = bundle({ url }, { fetchAsset }).then(({ code }) =>
        textDataUrl(code, "text/javascript")
      );
      pending.catch(() => runtimeModuleCache.delete(url));
      runtimeModuleCache.set(url, pending);
    }
    const dataUrl = await pending;
    html = html.split(`"${url}"`).join(`"${dataUrl}"`);
  }
  return html;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Assembles the page from the runtime html (with its imports already inlined)
 * and the frame's already-inlined hash-param string.
 */
export function assembleStandaloneHtml(options: {
  runtimeHtml: string;
  hashParams: string;
  title?: string;
  faviconSvg?: string;
  original: Record<string, unknown>;
}): string {
  const { runtimeHtml, hashParams, title, faviconSvg, original } = options;
  // Only the <head> is rewritten: the runtime's scripts below it contain
  // these same tag names as string literals ("<link", "<script").
  const headEnd = runtimeHtml.indexOf("</head>");
  if (headEnd === -1) throw new Error("runtime html has no </head>");
  const head = runtimeHtml.slice(0, headEnd)
    .replace(/<!-- OG_START -->[\s\S]*?<!-- OG_END -->/, "")
    .replace(/<meta\s+name="description"[^>]*>/, "")
    // Favicons, manifest, canonical, llms alternates: each one a request.
    .replace(/[ \t]*<link\b[^>]*>\r?\n?/g, "")
    .replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${escapeHtml(title || "framejs export")}</title>`,
    );

  const favicon = faviconSvg
    ? `<link rel="icon" type="image/svg+xml" href="${
      textDataUrl(faviconSvg, "image/svg+xml")
    }" />\n`
    : "";
  // __SHORT_URL_ID marks the page as being in short-url mode (params come from
  // __SHORT_URL_HASH_PARAMS, never from a server). It is not a real id: the
  // page has no server to hand an edit off to, which is why hm=disabled.
  const init =
    `<script id="standalone-init">window.__FRAMEJS_STANDALONE=true;` +
    `window.__SHORT_URL_ID="standalone";window.__SHORT_URL_VERSION=null;` +
    `window.__SHORT_URL_HASH_PARAMS=${jsonForScript(hashParams)};` +
    `window.__SHORT_URL_READY=Promise.resolve();</script>\n`;
  const record = `<script type="application/json" id="framejs-original">${
    jsonForScript(original)
  }</script>\n`;

  return head + favicon + init + record + runtimeHtml.slice(headEnd);
}

/**
 * The whole export: takes the frame's decoded hash params and returns the
 * self-contained page and the hash-param string it embeds.
 */
export async function buildStandaloneHtml(options: {
  params: Record<string, unknown>;
  runtimeHtml: string;
  faviconSvg?: string;
  origin: string;
  fetchAsset: FetchAsset;
  encodeHashParams: (params: Record<string, unknown>) => string;
}): Promise<string> {
  const { params, runtimeHtml, faviconSvg, origin, fetchAsset } = options;
  const js = typeof params.js === "string" ? params.js : "";
  if (!js.trim()) throw new ExportError("The frame has no code", 400);

  const out: Record<string, unknown> = { ...params };
  // Chrome, not content: the export has no editor to open (see top of file).
  delete out.edit;
  delete out.readonly;
  delete out.css;
  out.hm = "disabled";

  let importMap: ImportMapImports = {};
  if (Array.isArray(params.modules) && params.modules.length > 0) {
    const inlined = await inlineModules(params.modules as string[], {
      fetchAsset,
      origin,
    });
    importMap = inlined.importMap;
    if (inlined.modules.length > 0) out.modules = inlined.modules;
    else delete out.modules;
  }

  const options_ = params.options as { disableDatarefs?: boolean } | undefined;
  if (
    params.inputs && typeof params.inputs === "object" &&
    !Array.isArray(params.inputs) && !options_?.disableDatarefs
  ) {
    out.inputs = await inlineInputs(params.inputs as Record<string, unknown>, {
      fetchAsset,
      origin,
    });
  }

  let source: string;
  try {
    source = await resolveJsSource(js, fetchAsset);
    out.js = (await bundle({ contents: source, baseUrl: origin + "/" }, {
      fetchAsset,
      importMap,
    })).code;
  } catch (error) {
    if (error instanceof ExportError && error.status === 413) throw error;
    throw new ExportError(`Bundling the code failed: ${describe(error)}`);
  }

  let runtime: string;
  try {
    runtime = await inlineRuntimeImports(runtimeHtml, fetchAsset);
  } catch (error) {
    throw new ExportError(`Bundling the runtime failed: ${describe(error)}`);
  }

  const og = params.og as { title?: unknown } | undefined;
  return assembleStandaloneHtml({
    runtimeHtml: runtime,
    hashParams: options.encodeHashParams(out),
    title: typeof og?.title === "string" ? og.title : undefined,
    faviconSvg,
    original: {
      format: "framejs-standalone",
      version: STANDALONE_FORMAT_VERSION,
      exportedFrom: origin,
      params: { ...params, js: source },
    },
  });
}
