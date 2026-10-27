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

const ipv4Octets = (ip: string): number[] | null => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return null;
  const octets = m.slice(1).map(Number);
  return octets.every((o) => o <= 255) ? octets : null;
};

/**
 * Whether an IPv4 address is anything other than a public unicast address:
 * this-network, private, loopback, CGNAT, link-local, IETF protocol, TEST-NETs,
 * benchmarking, multicast, reserved, broadcast. Unparseable counts as private.
 */
export const isPrivateIPv4 = (ip: string): boolean => {
  const o = ipv4Octets(ip);
  if (!o) return true;
  const [a, b, c] = o;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113);
};

// An IPv6 address as its eight 16-bit groups, or null if it is not one.
// Accepts `::` compression and a dotted IPv4 tail (`::ffff:1.2.3.4`).
const ipv6Groups = (ip: string): number[] | null => {
  let s = ip.toLowerCase().replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  const tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (tail) {
    const o = ipv4Octets(tail[1]);
    if (!o) return null;
    s = s.slice(0, -tail[1].length) +
      ((o[0] << 8) | o[1]).toString(16) + ":" +
      ((o[2] << 8) | o[3]).toString(16);
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const parse = (part: string) => (part ? part.split(":") : []);
  const head = parse(halves[0]);
  const rest = halves.length === 2 ? parse(halves[1]) : [];
  const fill = 8 - head.length - rest.length;
  if (halves.length === 2 ? fill < 1 : fill !== 0) return null;
  const groups = [...head, ...Array(fill).fill("0"), ...rest];
  if (!groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.map((g) => parseInt(g, 16));
};

const embeddedIPv4 = (hi: number, lo: number) =>
  `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;

/**
 * Whether an IPv6 address is anything other than a public unicast address.
 * Forms that carry an IPv4 address are judged by it, or refused outright where
 * there is no legitimate reason for a public URL to use them. Unparseable
 * counts as private.
 */
export const isPrivateIPv6 = (ip: string): boolean => {
  const g = ipv6Groups(ip);
  if (!g) return true;
  const zeroUpTo = (n: number) => g.slice(0, n).every((x) => x === 0);
  // ::/96 — unspecified, loopback, and deprecated IPv4-compatible (::a.b.c.d)
  if (zeroUpTo(6)) return true;
  // ::ffff:0:0/96 IPv4-mapped, ::ffff:0:0:0/96 IPv4-translated
  if (zeroUpTo(5) && g[5] === 0xffff) return true;
  if (zeroUpTo(4) && g[4] === 0xffff && g[5] === 0) return true;
  // 64:ff9b::/96 NAT64: judged by the IPv4 address inside it
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) {
    return isPrivateIPv4(embeddedIPv4(g[6], g[7]));
  }
  // 64:ff9b:1::/48 local-use NAT64
  if (g[0] === 0x64 && g[1] === 0xff9b && g[2] === 1) return true;
  // 2002::/16 6to4: judged by the IPv4 address inside it
  if (g[0] === 0x2002) return isPrivateIPv4(embeddedIPv4(g[1], g[2]));
  return (g[0] & 0xfe00) === 0xfc00 || // fc00::/7 unique local
    (g[0] & 0xffc0) === 0xfe80 || // fe80::/10 link-local
    (g[0] & 0xffc0) === 0xfec0 || // fec0::/10 site-local (deprecated)
    (g[0] & 0xff00) === 0xff00 || // ff00::/8 multicast
    (g[0] === 0x2001 && g[1] === 0) || // 2001::/32 Teredo
    (g[0] === 0x2001 && g[1] === 0xdb8) || // 2001:db8::/32 documentation
    (g[0] === 0x100 && g[1] === 0 && g[2] === 0 && g[3] === 0); // 100::/64 discard
};

/** Whether `address` (a literal IPv4 or IPv6 address) is not public. */
export const isPrivateAddress = (address: string): boolean =>
  ipv4Octets(address) ? isPrivateIPv4(address) : isPrivateIPv6(address);

/**
 * Whether the server may fetch `url` on a user's behalf, judging the URL
 * alone. The export fetches URLs the user chose, so it must not become a way
 * to read the server's own network: only http(s), never a loopback/private
 * address literal or a bare internal hostname (a docker service name like
 * `seaweedfs`). A public-looking NAME can still resolve to a private address
 * (`127.0.0.1.nip.io`): createPublicFetch resolves and checks that too.
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
  if (host.startsWith("[")) return !isPrivateIPv6(host);
  if (/^[\d.]+$/.test(host)) return !isPrivateIPv4(host);
  if (!host.includes(".")) return false;
  return !(host === "localhost" || host.endsWith(".localhost") ||
    host.endsWith(".internal") || host.endsWith(".local") ||
    host.endsWith(".home.arpa"));
};

/** Resolves a hostname to every address it has (A and AAAA). */
export type ResolveHost = (host: string) => Promise<string[]>;

export const resolveHostDns: ResolveHost = async (host) => {
  const results = await Promise.allSettled([
    Deno.resolveDns(host, "A"),
    Deno.resolveDns(host, "AAAA"),
  ]);
  return results.flatMap((r) => r.status === "fulfilled" ? r.value : []);
};

const tooLarge = (url: string) =>
  new ExportError(`${url} is larger than the export size limit allows`, 413);

// Reads a body without ever holding more than `maxBytes` of it: refused up
// front on Content-Length, and cancelled as soon as the stream passes it.
async function readCapped(
  response: Response,
  url: string,
  maxBytes: number | undefined,
): Promise<Uint8Array> {
  const declared = Number(response.headers.get("content-length"));
  if (maxBytes !== undefined && declared > maxBytes) {
    await response.body?.cancel();
    throw tooLarge(url);
  }
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (maxBytes !== undefined && total > maxBytes) {
      await reader.cancel();
      throw tooLarge(url);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/**
 * A FetchAsset over the public internet. Before every hop (so a redirect
 * cannot bounce it inward) the URL is checked, and its hostname is resolved
 * and refused if ANY of its addresses is not public. Times out, refuses
 * non-2xx responses, and streams the body under `maxBytes`.
 *
 * Residual gap, accepted: the check and the connection resolve separately, so
 * a hostile DNS server answering differently a moment later (true DNS
 * rebinding) is not covered — Deno's fetch cannot be pinned to an address while
 * keeping TLS verification of the name.
 */
export const createPublicFetch = (
  options: {
    fetchImpl?: typeof fetch;
    resolveHost?: ResolveHost;
    timeoutMs?: number;
  } = {},
): FetchAsset => {
  const {
    fetchImpl = fetch,
    resolveHost = resolveHostDns,
    timeoutMs = 30_000,
  } = options;
  const refuse = (url: string, why: string) =>
    new ExportError(`Refusing to fetch ${url}: ${why}`);
  return async (url, { maxBytes } = {}) => {
    let current = url;
    for (let hop = 0; hop < 10; hop++) {
      if (!isFetchableUrl(current)) {
        throw refuse(current, "not a public http(s) address");
      }
      const host = new URL(current).hostname.replace(/^\[|\]$/g, "");
      if (!ipv4Octets(host) && !host.includes(":")) {
        const addresses = await resolveHost(host);
        if (addresses.length === 0) throw refuse(current, "host not found");
        if (addresses.some(isPrivateAddress)) {
          throw refuse(current, "host resolves to a non-public address");
        }
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
        bytes: await readCapped(response, url, maxBytes),
        contentType: response.headers.get("content-type") ||
          "application/octet-stream",
      };
    }
    throw new ExportError(`Too many redirects fetching ${url}`);
  };
};

/**
 * Wraps a FetchAsset so one export fetches each URL once, and fails as soon as
 * the total it has pulled in passes `maxBytes`. Each fetch is only allowed the
 * budget that is left, so nothing much larger than the limit is ever held.
 */
export const withBudget = (
  fetchAsset: FetchAsset,
  maxBytes: number,
): FetchAsset => {
  const seen = new Map<string, Promise<FetchedAsset>>();
  let total = 0;
  const overBudget = () =>
    new ExportError(
      `The export is larger than the ${
        Math.round(maxBytes / 1024 / 1024)
      }MB limit`,
      413,
    );
  return (url) => {
    let pending = seen.get(url);
    if (!pending) {
      pending = fetchAsset(url, { maxBytes: Math.max(0, maxBytes - total) })
        .catch((error) => {
          throw error instanceof ExportError && error.status === 413
            ? overBudget()
            : error;
        })
        .then((asset) => {
          total += asset.bytes.byteLength;
          if (total > maxBytes) throw overBudget();
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

/**
 * An attribute of a tag's opening element: double-, single- or un-quoted, and
 * anchored on whitespace so `src` never matches `data-src`.
 */
export const attr = (tag: string, name: string): string | undefined => {
  const open = /^<[^>]*/.exec(tag)?.[0] ?? tag;
  const m = new RegExp(
    `\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`,
    "i",
  ).exec(open);
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
};

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

  // Each entry becomes its inlined form, or null when it is dropped. Fetched
  // in parallel; the order of the list is kept. Anything that cannot be made
  // network-free fails the export by name rather than being dropped, or kept
  // as it is to make a request at run time.
  const inlineEntry = async (entry: string): Promise<string | null> => {
    const trimmed = entry.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("<link")) {
      const rel = attr(trimmed, "rel")?.toLowerCase() ?? "stylesheet";
      // Only a stylesheet does anything for the page; preconnect, icon,
      // preload and friends would only make requests.
      if (rel !== "stylesheet") return null;
      const href = attr(trimmed, "href");
      if (!href) throw new Error("a stylesheet <link> without an href");
      return `<link rel="stylesheet" href="${await bundleCss(href)}">`;
    }
    if (trimmed.startsWith("<script")) {
      const src = attr(trimmed, "src");
      // The runtime only ever loads <script src>; an inline body is never run.
      if (!src) throw new Error("a <script> without a src is not supported");
      const type = attr(trimmed, "type");
      if (type === "module") {
        const { code } = await bundle({ url: absolute(src) }, {
          fetchAsset,
          importMap,
        });
        return `<script type="module" src="${
          textDataUrl(code, "text/javascript")
        }"></script>`;
      }
      const asset = await fetchAsset(absolute(src));
      return `<script${type ? ` type="${type}"` : ""} src="${
        toDataUrl(asset.bytes, "text/javascript")
      }"></script>`;
    }
    if (trimmed.startsWith("<")) {
      throw new Error("not a <script> or <link> tag, or a URL");
    }
    if (trimmed.endsWith(".css")) {
      return `<link rel="stylesheet" href="${await bundleCss(trimmed)}">`;
    }
    // A bare URL is loaded as a classic script.
    const asset = await fetchAsset(absolute(trimmed));
    return toDataUrl(asset.bytes, "text/javascript");
  };

  const out = (await Promise.all(rest.map(async (entry) => {
    try {
      return await inlineEntry(entry);
    } catch (error) {
      if (error instanceof ExportError && error.status === 413) throw error;
      throw new ExportError(`Module ${entry.trim()}: ${describe(error)}`);
    }
  }))).filter((entry): entry is string => entry !== null);
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
  const inlineInput = async (original: unknown): Promise<unknown> => {
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
    if (!ref || typeof ref !== "object" || typeof ref.value !== "string") {
      return value;
    }
    let asset: FetchedAsset;
    if (ref.type === "url" && !ref.value.startsWith("data:")) {
      asset = await fetchAsset(new URL(ref.value, origin + "/").href);
    } else if (ref.type === "key") {
      const pointer = await fetchAsset(
        `${CONTAINER_ADDRESS}/download/${encodeURIComponent(ref.value)}`,
      );
      const { url } = JSON.parse(new TextDecoder().decode(pointer.bytes));
      asset = await fetchAsset(url);
    } else {
      return value;
    }
    // Every other field of the ref is kept; only where the bytes are changes.
    return {
      ...ref,
      type: "url",
      value: toDataUrl(asset.bytes, asset.contentType),
    };
  };

  // Fetched in parallel: a frame with several url inputs should not take the
  // sum of their download times.
  const entries = await Promise.all(
    Object.entries(inputs).map(async ([key, original]) => {
      try {
        return [key, await inlineInput(original)] as const;
      } catch (error) {
        if (error instanceof ExportError && error.status === 413) throw error;
        throw new ExportError(`Input "${key}": ${describe(error)}`);
      }
    }),
  );
  const out: Record<string, unknown> = Object.fromEntries(entries);
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
  /** What relative URLs in the frame resolve against (the request's origin). */
  origin: string;
  /**
   * The canonical origin recorded in the file. Not the request's host, which
   * the client controls and which would make the sha depend on the host alias.
   */
  publicOrigin: string;
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
      exportedFrom: options.publicOrigin,
      params: { ...params, js: source },
    },
  });
}
