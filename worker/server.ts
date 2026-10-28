// Heavy, route-specific dependencies are loaded lazily via dynamic import()
// inside the handlers that use them — @aws-sdk/client-s3 alone pulls ~140 modules,
// plus @aws-sdk/s3-request-presigner, @resvg/resvg-wasm and qrcode. Keeping them
// off the top-level import graph means a cold isolate serving the HTML shell ("/")
// never pays their instantiation cost. Only the S3Client type is imported here
// (erased at runtime). See getS3Client()/s3Mod(), ensureResvg()/renderFaviconPng()
// and the /api and /j routes.
import type { S3Client } from "npm:@aws-sdk/client-s3";

import { Hono } from "@hono/hono";
import type { Context } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { serveStatic } from "@hono/hono/deno";
import {
  blobFromBase64String,
  getUrlHashParamsFromHashString,
  stringFromBase64String,
} from "@metapages/hash-query";
import type { HashParamType } from "@metapages/metapage";

import { detectEmbed, detectSource, track } from "./src/analytics.ts";
import { saveFrame } from "./src/frame-save.ts";
import { normalizeUuid, UUID_REGEX } from "./src/frame-uuid.ts";
import {
  computeMetaframeDefinition,
  DEFAULT_METAFRAME_DEFINITION,
  jsonToHashParams,
  stripDefaultHashParams,
} from "./src/metaframe-definition.ts";
import { buildOgMetaTags, escapeHtmlAttr } from "./src/og.ts";
import {
  brandingScript,
  extractBranding,
  pinnedVersionFromQuery,
  pinnedVersionSuffix,
  runtimeHashParams,
} from "./src/pinned-version.ts";
import { extractModule, ModuleExportError } from "./src/module-export.ts";
import { frameOgPath, shortUrlInitScript } from "./src/short-url-init.ts";
import type { FetchAsset } from "./src/standalone-bundle.ts";
import {
  buildStandaloneHtml,
  createPublicFetch,
  ExportError,
  resolveJsSource,
  withBudget,
} from "./src/standalone-export.ts";

/**
 * Reads index.html, strips its default OG block, and injects the given OG meta
 * tags plus a bootstrap <script> just before </head>. Returns the HTML Response
 * used to serve a short-URL page.
 */
async function serveShortUrlHtml(
  ogMetaTags: string,
  injectedScript: string,
  extraHead = "",
): Promise<Response> {
  const indexHtml = await Deno.readTextFile("./index.html");
  let html = indexHtml.replace(
    /<!-- OG_START -->[\s\S]*?<!-- OG_END -->/,
    "",
  );
  // When a per-frame favicon is injected, strip the static <link rel="icon">
  // tags from index.html first. Browsers don't take "the last matching rel" —
  // they choose the best icon candidate and prefer a scalable SVG over a
  // size-less PNG regardless of source order, so index.html's /favicon.svg would
  // otherwise always win and the per-frame favicon would never show. Removing the
  // static icons leaves the injected per-frame favicon as the only rel="icon".
  if (/rel="icon"/.test(extraHead)) {
    html = html.replace(/[ \t]*<link\b[^>]*\brel="icon"[^>]*>\r?\n?/g, "");
  }
  const modifiedHtml = html.replace(
    "</head>",
    ogMetaTags + extraHead + injectedScript + "\n</head>",
  );
  return new Response(modifiedHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

/**
 * Decodes a raw hash params string (e.g. "?js=abc&inputs=def") into a JSON
 * object with correctly decoded values, using the type metadata from
 * DEFAULT_METAFRAME_DEFINITION (and any user-provided definition). All
 * splitting/decoding is delegated to @metapages/hash-query — the module
 * @metapages/hash-query's own encoder (jsonToHashParams, above) targets —
 * rather than hand-rolled parsing, so both directions stay in sync by
 * construction.
 */
function decodeHashParamsToJson(hashParams: string): Record<string, unknown> {
  // Normalize the leading marker. The stored blob varies by shorten path:
  // /api/shorten/json builds it via jsonToHashParams (leading "?"), but
  // /api/shorten stores the client string verbatim, which may be a bare
  // "js=...&og=..." (or "#js=..."). getUrlHashParamsFromHashString only parses
  // a "?"-prefixed query, returning {} for a bare/"#"-only string — which
  // silently dropped og (favicon + OG meta) for those frames. Strip any leading
  // "#" and ensure exactly one "?" so every stored form decodes identically.
  let normalized = hashParams.startsWith("#")
    ? hashParams.slice(1)
    : hashParams;
  if (normalized && !normalized.startsWith("?")) normalized = "?" + normalized;
  const [, hashObject] = getUrlHashParamsFromHashString(normalized);

  // Build type map from default definition
  const typeMap: Record<string, HashParamType> = {};
  const defaultHP = DEFAULT_METAFRAME_DEFINITION.hashParams;
  if (defaultHP && typeof defaultHP === "object" && !Array.isArray(defaultHP)) {
    for (const [k, v] of Object.entries(defaultHP)) {
      typeMap[k] = (v as { type?: HashParamType }).type || "json";
    }
  }

  // Decode definition (always json type) to discover custom param types
  if (hashObject.definition) {
    const def = blobFromBase64String(hashObject.definition) as
      | Record<string, unknown>
      | undefined;
    const defHP = def?.hashParams;
    if (defHP && typeof defHP === "object" && !Array.isArray(defHP)) {
      for (
        const [k, v] of Object.entries(
          defHP as Record<string, { type?: HashParamType }>,
        )
      ) {
        if (!typeMap[k]) {
          typeMap[k] = v.type || "json";
        }
      }
    }
  }

  const result: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(hashObject)) {
    const type = typeMap[key] || "json";

    try {
      if (type === "json") {
        result[key] = blobFromBase64String(rawValue);
      } else if (type === "stringBase64") {
        result[key] = stringFromBase64String(rawValue);
      } else if (type === "boolean") {
        result[key] = rawValue === "true";
      } else if (type === "number") {
        const num = parseFloat(rawValue);
        result[key] = isNaN(num) ? rawValue : num;
      } else {
        // "string" or unknown type
        result[key] = rawValue;
      }
    } catch {
      result[key] = rawValue;
    }
  }

  // Default-valued params carry no information — strip them so they never
  // appear in JSON representations or API responses.
  return stripDefaultHashParams(result);
}

const port: number = parseInt(Deno.env.get("PORT") || "3000");

// S3-compatible storage config (works with Cloudflare R2 and SeaweedFS)
const S3_ENDPOINT = Deno.env.get("S3_ENDPOINT");
const S3_PRESIGN_ENDPOINT = Deno.env.get("S3_PRESIGN_ENDPOINT");
const S3_ACCESS_KEY_ID = Deno.env.get("S3_ACCESS_KEY_ID");
const S3_SECRET_ACCESS_KEY = Deno.env.get("S3_SECRET_ACCESS_KEY");
const S3_BUCKET_NAME = Deno.env.get("S3_BUCKET_NAME") || "uploads";
const S3_PUBLIC_URL = Deno.env.get("S3_PUBLIC_URL");
// Canonical public origin, used for durable artifacts like QR codes so the
// encoded URL is stable regardless of which host the request arrived on.
const PUBLIC_ORIGIN = (
  Deno.env.get("PUBLIC_ORIGIN") || "https://framejs.io"
).replace(/\/$/, "");
const S3_UPLOAD_MAX_SIZE_MB = parseInt(
  Deno.env.get("S3_UPLOAD_MAX_SIZE_MB") || "500",
);
// Cap on a standalone HTML export, applied twice: to everything it pulls in
// (code, modules, inputs — streamed, so no fetch holds much more than what is
// left of it) and to the finished file. The file is LARGER than what was
// fetched: an inlined input is base64'd into a data: URL, and that again by the
// hash-param encoding (~1.8x), so the fetch budget is the early abort and the
// file check is the real bound. Kept low because the build holds a few copies
// of the file in memory at once.
const EXPORT_HTML_MAX_SIZE_MB = parseInt(
  Deno.env.get("EXPORT_HTML_MAX_SIZE_MB") || "50",
);
// Exports building at once in this isolate. Each one holds up to a few times
// EXPORT_HTML_MAX_SIZE_MB and runs esbuild, so more are turned away (429)
// rather than allowed to exhaust the isolate's memory.
const EXPORT_HTML_MAX_CONCURRENT = parseInt(
  Deno.env.get("EXPORT_HTML_MAX_CONCURRENT") || "2",
);
// Backend that resolves a frame UUID to its hash-param values. The /j/:uuid
// route fetches `${FRAMEJS_APP_ORIGIN}/<uuid>` and expects a JSON object of hash
// param values (e.g. {js, modules, inputs, og}) on a 200 response.
const FRAMEJS_APP_ORIGIN_DEFAULT = "https://framejs.app";
const FRAMEJS_APP_ORIGIN = (
  Deno.env.get("FRAMEJS_APP_ORIGIN") || FRAMEJS_APP_ORIGIN_DEFAULT
).replace(/\/$/, "");
if (FRAMEJS_APP_ORIGIN !== FRAMEJS_APP_ORIGIN_DEFAULT) {
  console.log(
    `⚙ FRAMEJS_APP_ORIGIN overridden → ${FRAMEJS_APP_ORIGIN} (default: ${FRAMEJS_APP_ORIGIN_DEFAULT})`,
  );
}

const getPublicUrl = (id: string) => {
  return `${S3_PUBLIC_URL}/${id}`;
};

const s3Credentials = S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY
  ? { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY }
  : undefined;

// Whether S3 is configured. Kept as sync booleans so route guards can return a
// 503 without awaiting the SDK import — and so `/` never triggers the import.
const s3Configured = !!(s3Credentials && S3_ENDPOINT);
const presignEndpoint = S3_PRESIGN_ENDPOINT || S3_ENDPOINT;
const s3PresignConfigured = !!(s3Credentials && presignEndpoint);

// Lazily import the AWS SDK (~140 modules) only on first S3 use. Memoized so the
// import happens once per isolate, off the HTML hot path.
type S3ClientModule = typeof import("npm:@aws-sdk/client-s3");
let _s3Mod: Promise<S3ClientModule> | undefined;
const s3Mod = (): Promise<
  S3ClientModule
> => (_s3Mod ??= import("npm:@aws-sdk/client-s3"));

// Server-side S3 client for actual S3 operations (PutObject, GetObject).
// Uses the internal Docker network endpoint (e.g. http://seaweedfs:8333).
// Constructed lazily on first use; `null` means S3 is not configured.
let _s3Client: S3Client | null | undefined;
async function getS3Client(): Promise<S3Client | null> {
  if (_s3Client !== undefined) return _s3Client;
  if (!s3Configured) return (_s3Client = null);
  const { S3Client } = await s3Mod();
  _s3Client = new S3Client({
    endpoint: S3_ENDPOINT,
    forcePathStyle: true,
    region: "auto",
    credentials: s3Credentials!,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  console.log(`S3 client configured: endpoint=${S3_ENDPOINT}`);
  return _s3Client;
}

// Presign client for generating browser-facing presigned URLs.
// Uses S3_PRESIGN_ENDPOINT (browser-reachable, e.g. https://s3.localhost) if set,
// otherwise falls back to S3_ENDPOINT (e.g. production R2 where the endpoint is
// directly reachable from the browser). Constructed lazily on first use.
let _s3PresignClient: S3Client | null | undefined;
async function getS3PresignClient(): Promise<S3Client | null> {
  if (_s3PresignClient !== undefined) return _s3PresignClient;
  if (!s3PresignConfigured) return (_s3PresignClient = null);
  const { S3Client } = await s3Mod();
  _s3PresignClient = new S3Client({
    endpoint: presignEndpoint,
    forcePathStyle: true,
    region: "auto",
    credentials: s3Credentials!,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  console.log(`S3 presign client configured: endpoint=${presignEndpoint}`);
  return _s3PresignClient;
}

// ---------------------------------------------------------------------------
// Per-frame derived favicons (the frame's og image, full-bleed, 64×64).
//
// A frame's content (and thus its og image) is immutable once shortened to a
// sha256, so its favicon is computed ONCE at shorten time and stored permanently
// under `favicon/{sha256}` (the 7-day ILM expiry is scoped to the transient `f/`
// upload prefix, so `favicon/` and `j/` survive — verify the prod R2 lifecycle
// likewise excludes `favicon/`). The serve route `/j/:sha256/favicon.png` only
// looks it up — it never generates — so it stays fast and returns the default
// favicon until one exists. The composite matches framejs.app's (resvg-wasm on
// the same SVG), so a frame looks identical whichever origin renders it.
// ---------------------------------------------------------------------------

const FAVICON_MAX_SOURCE_BYTES = 15 * 1024 * 1024;
// resvg's wasm binary. Fetched (and cached by Deno) once per isolate; generation
// only happens at shorten time and is best-effort, so a cold fetch here never sits
// on a hot path. Pin the version to the imported package.
const RESVG_WASM_URL =
  "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm";

let resvgReady: Promise<void> | undefined;
function ensureResvg(): Promise<void> {
  // resvg-wasm is imported lazily — favicon generation only happens at shorten
  // time, so it stays off the isolate's boot module graph.
  if (!resvgReady) {
    resvgReady = import("@resvg/resvg-wasm").then(({ initWasm }) =>
      initWasm(fetch(RESVG_WASM_URL))
    );
  }
  return resvgReady;
}

/**
 * Composite the derived favicon: the frame's og image, full-bleed and
 * center-cropped to fill the whole 64×64 icon (no border, no background).
 * Returns a 64×64 PNG.
 */
function bytesToBase64(bytes: Uint8Array): string {
  // Chunked to avoid blowing the call stack on `String.fromCharCode(...big)`.
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function renderFaviconPng(
  imageBytes: Uint8Array,
  mimeType: string,
): Promise<Uint8Array> {
  await ensureResvg();
  const { Resvg } = await import("@resvg/resvg-wasm");
  const dataUri = `data:${mimeType};base64,${bytesToBase64(imageBytes)}`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <image href="${dataUri}" x="0" y="0" width="64" height="64" preserveAspectRatio="xMidYMid slice"/>
</svg>`;
  return new Resvg(svg, { fitTo: { mode: "original" } }).render().asPng();
}

/** Whether `favicon/{sha256}` already exists in storage. */
async function faviconExists(sha256: string): Promise<boolean> {
  const s3 = await getS3Client();
  if (!s3) return false;
  try {
    const { HeadObjectCommand } = await s3Mod();
    await s3.send(
      new HeadObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: `favicon/${sha256}`,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

// Fetch the og image bytes; `/f/<id>` (relative or same-origin) resolve against
// the public origin, external URLs are fetched as-is. Returns null when there's
// nothing usable to composite.
async function fetchOgImageBytes(
  ogImage: string,
): Promise<{ bytes: Uint8Array; mime: string } | null> {
  try {
    const src = ogImage.startsWith("/")
      ? `${PUBLIC_ORIGIN}${ogImage}`
      : ogImage;
    const res = await fetch(src, { redirect: "follow" });
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") ?? "application/octet-stream";
    if (!mime.startsWith("image/")) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > FAVICON_MAX_SOURCE_BYTES) {
      return null;
    }
    return { bytes, mime };
  } catch {
    return null;
  }
}

/**
 * ── The `og/<sha256>` sidecar ───────────────────────────────────────────────
 *
 * A frame's OG metadata, stored beside the full blob at `j/<sha256>` (same
 * convention as `favicon/<sha256>`).
 *
 * It exists so rendering a `/j/<sha256>` PAGE doesn't have to read the whole
 * blob. The page needs exactly two things from the content — the og meta tags
 * and whether there is an og image (for the favicon link) — and it used to get
 * them by fetching and decoding the entire thing. The browser then fetched the
 * same blob again via `/api/j/<sha>/runtime-params`, so a megabyte-class frame
 * was read out of S3 twice per page load to produce ~200 bytes of `<meta>`.
 *
 * Safe to treat as authoritative: the content is addressed by the hash of the
 * blob, so neither the blob nor anything derived from it can ever change.
 *
 * Written even when the frame has NO og data (as `{"og":null}`) — presence of
 * the sidecar then means "this frame exists and has been indexed", which is
 * what lets the page handler skip the existence check on a hit. Absence is
 * ambiguous (a frame shortened before this shipped, vs no frame at all), so a
 * miss falls back to the blob.
 */
const ogSidecarKey = (sha256: string) => `og/${sha256}`;

/**
 * Derive + store the og sidecar. Best-effort: never throws, so it cannot break
 * the shorten (or the page load) it is called from — a miss just costs the
 * fallback read next time.
 */
async function writeOgSidecar(
  sha256: string,
  hashParams: string,
): Promise<void> {
  try {
    const s3 = await getS3Client();
    if (!s3) return;
    const og = decodeHashParamsToJson(hashParams).og ?? null;
    const { PutObjectCommand } = await s3Mod();
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: ogSidecarKey(sha256),
        Body: JSON.stringify({ og }),
        ContentType: "application/json; charset=utf-8",
      }),
    );
  } catch (error) {
    console.error(`og sidecar write failed for ${sha256}:`, error);
  }
}

/**
 * The og sidecar for a frame, or null when there isn't one (an older frame, or
 * no such frame — the caller cannot tell the two apart and must fall back).
 * Shaped like a decoded-params record so it drops straight into
 * `buildOgMetaTags`.
 */
async function readOgSidecar(
  sha256: string,
): Promise<Record<string, unknown> | null> {
  try {
    const s3 = await getS3Client();
    if (!s3) return null;
    const { GetObjectCommand } = await s3Mod();
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: ogSidecarKey(sha256),
      }),
    );
    if (!response.Body) return null;
    const parsed = JSON.parse(await response.Body.transformToString());
    return parsed && typeof parsed === "object"
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    // NoSuchKey, or a sidecar we can't parse — either way, fall back.
    return null;
  }
}

/**
 * Eagerly generate + permanently store the favicon for a freshly-shortened
 * frame, if it has an og image and one isn't already stored. Best-effort: never
 * throws, so a favicon failure can't break the shorten it's called from.
 */
async function generateFaviconForSha256(
  sha256: string,
  hashParams: string,
): Promise<void> {
  try {
    const s3 = await getS3Client();
    if (!s3) return;
    const og = decodeHashParamsToJson(hashParams).og as
      | { image?: string }
      | undefined;
    if (!og?.image) return;
    if (await faviconExists(sha256)) return;
    const source = await fetchOgImageBytes(og.image);
    if (!source) return;
    const png = await renderFaviconPng(source.bytes, source.mime);
    const { PutObjectCommand } = await s3Mod();
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: `favicon/${sha256}`,
        Body: png,
        ContentType: "image/png",
      }),
    );
  } catch (error) {
    console.error(`favicon generation failed for ${sha256}:`, error);
  }
}

const app = new Hono();

// Global CORS
app.use("*", cors({ origin: "*" }));

// Routes
let indexHtmlProcessed = "";
let indexHtmlEtag = "";

// Cache directives for the app shell. It is byte-identical for every visitor, so
// let the Deno Deploy CDN hold it (Deno-CDN-Cache-Control / s-maxage) to absorb
// isolate cold starts — the dominant cost for what is essentially a static page.
// The edge cache is auto-invalidated on every deploy, so a new version is served
// instantly. Browsers always revalidate (max-age=0) and get a cheap 304 via the
// ETag, so they pick up a deploy on their next navigation too.
//
// TRADEOFF: because most `/` hits are served from the edge, the isolate is not
// invoked, so the server-side pageview `track()` below undercounts top-level app
// loads. Custom events on the uncached /api and /j routes are unaffected.
const SHELL_CDN_CACHE = "public, s-maxage=86400, stale-while-revalidate=604800";
const SHELL_BROWSER_CACHE = "public, max-age=0, must-revalidate";

// Short, stable ETag from a SHA-256 prefix of the served body.
async function computeEtag(body: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body),
  );
  const hex = Array.from(new Uint8Array(digest).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `"${hex}"`;
}

// Inject the configured framejs.app origin so the client can link/navigate to the
// right host in dev vs prod (the client reads window.__FRAMEJS_APP_ORIGIN, falling
// back to the prod default). The editor iframe reads it from window.parent, and
// so does the landing page module (worker/static/landing.js), which is served
// as a plain static file and so is never rewritten.
//
// This is the ONLY rewriting of the shell. It used to also replaceAll
// "https://framejs.app" in the body, for the landing markup that was inline
// here; that markup is its own module now, and a blanket string replacement
// over the whole runtime is not something to keep around on spec.
const buildIndexHtml = async (): Promise<string> => {
  const indexHtml = await Deno.readTextFile("./index.html");
  return indexHtml.replace(
    "</head>",
    `<script id="framejs-app-origin-init">window.__FRAMEJS_APP_ORIGIN=${
      JSON.stringify(FRAMEJS_APP_ORIGIN)
    }</script>\n</head>`,
  );
};

const serveIndex = async (c?: Context): Promise<Response> => {
  // In dev, always re-read from disk (so edits are picked up without a restart)
  // and skip caching entirely.
  if (Deno.env.get("DEV") === "true") {
    return new Response(await buildIndexHtml(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  // In prod, process once per isolate and cache the string + its ETag.
  if (!indexHtmlProcessed) {
    indexHtmlProcessed = await buildIndexHtml();
    indexHtmlEtag = await computeEtag(indexHtmlProcessed);
  }
  const cacheHeaders: Record<string, string> = {
    "Cache-Control": SHELL_BROWSER_CACHE,
    "Deno-CDN-Cache-Control": SHELL_CDN_CACHE,
    "Deno-Cache-Tag": "index-shell",
    "ETag": indexHtmlEtag,
  };
  // Conditional request that still reaches the isolate → 304, so the ~79KB shell
  // isn't re-sent.
  if (c && c.req.header("if-none-match") === indexHtmlEtag) {
    return new Response(null, { status: 304, headers: cacheHeaders });
  }
  return new Response(indexHtmlProcessed, {
    headers: { "Content-Type": "text/html; charset=utf-8", ...cacheHeaders },
  });
};

app.get("/", (c) => {
  track(c); // pageview — main app load (undercounts when edge-cached; see above)
  const embedOrigin = detectEmbed(c);
  if (embedOrigin) {
    // Embedded in an iframe — record the embedding origin so the dashboard can
    // count and break down where the app is being embedded.
    track(c, { name: "embed", source: "browser", embedOrigin });
  }
  return serveIndex(c);
});
app.get("/index.html", (c) => serveIndex(c));

app.get("/sw.js", async () => {
  try {
    const swJs = await Deno.readTextFile("./sw.js");
    return new Response(swJs, {
      headers: {
        "Content-Type": "application/javascript",
        "Service-Worker-Allowed": "/",
      },
    });
  } catch (error) {
    console.error("Error serving service worker:", error);
    return new Response("Service worker not found", { status: 404 });
  }
});

app.get("/cache-test-utils.js", async () => {
  try {
    const testUtilsJs = await Deno.readTextFile("./cache-test-utils.js");
    return new Response(testUtilsJs, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error serving cache test utilities:", error);
    return new Response("Cache test utilities not found", { status: 404 });
  }
});

app.get("/metaframe.json", (c) => {
  return c.json(DEFAULT_METAFRAME_DEFINITION);
});

app.get("/editor/metaframe.json", (c) => {
  return c.json(DEFAULT_METAFRAME_DEFINITION);
});

// Upload presign endpoint — returns a presigned URL for direct browser-to-S3 upload
app.post("/api/upload/presign", async (c) => {
  const s3 = await getS3PresignClient();
  if (!s3) {
    return c.json({ error: "File upload not configured" }, 503);
  }

  try {
    const body = await c.req.json();
    const { contentType, fileSize, sha256 } = body;

    if (!contentType) {
      return c.json({ error: "Missing required field: contentType" }, 400);
    }

    if (fileSize && fileSize > S3_UPLOAD_MAX_SIZE_MB * 1024 * 1024) {
      return c.json(
        { error: `File too large. Max size: ${S3_UPLOAD_MAX_SIZE_MB}MB` },
        400,
      );
    }

    // Use SHA256 content hash if provided, otherwise fall back to UUID
    const id = sha256 || crypto.randomUUID();
    // Store file with just the id as the key (no filename)
    const key = `f/${id}`;

    const { PutObjectCommand } = await s3Mod();
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL using the browser-reachable endpoint
    const { getSignedUrl } = await import("npm:@aws-sdk/s3-request-presigner");
    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });
    // Canonical path for accessing the file via the worker's download endpoint
    const canonicalPath = `/f/${id}`;

    return c.json({ presignedUrl, canonicalPath, key, id });
  } catch (error) {
    console.error("Presign error:", error);
    return c.json({ error: "Failed to generate presigned URL" }, 500);
  }
});

// URL shortening endpoint — stores hash params in S3
app.post("/api/shorten", async (c) => {
  const s3 = await getS3Client();
  if (!s3) {
    return c.json({ error: "URL shortening not configured" }, 503);
  }

  try {
    const body = await c.req.json();
    const { hashParams } = body;

    if (!hashParams) {
      return c.json({ error: "Missing required field: hashParams" }, 400);
    }

    // Calculate SHA256 hash on the server
    const encoder = new TextEncoder();
    const data = encoder.encode(hashParams);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const sha256 = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Store in S3 with key j/{sha256}
    const key = `j/${sha256}`;
    const { PutObjectCommand } = await s3Mod();
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: hashParams,
      ContentType: "text/plain; charset=utf-8",
    });

    await s3.send(command);

    // Eagerly derive the frame's favicon and og sidecar (best-effort, neither
    // throws). The content is immutable, so both compute once and store
    // permanently. The sidecar is what keeps the /j/<sha256> page from having
    // to read this whole blob just for its <meta> tags — see ogSidecarKey.
    await generateFaviconForSha256(sha256, hashParams);
    await writeOgSidecar(sha256, hashParams);

    track(c, { name: "shorten", source: detectSource(c) });

    return c.json({
      success: true,
      id: sha256,
      path: `/j/${sha256}`,
    });
  } catch (error) {
    console.error("Shorten URL error:", error);
    return c.json({ error: "Failed to shorten URL" }, 500);
  }
});

// URL shortening from JSON body — encodes each field to hash-param format
app.post("/api/shorten/json", async (c) => {
  const s3 = await getS3Client();
  if (!s3) {
    return c.json({ error: "URL shortening not configured" }, 503);
  }

  try {
    // Strip default-valued params so they are never persisted into the URL.
    const body = stripDefaultHashParams(await c.req.json());

    // Encode each recognised field into a hash-param string (sorted for
    // SHA256 consistency).
    const hashParams = jsonToHashParams(body);

    if (!hashParams) {
      return c.json({ error: "No recognised fields provided" }, 400);
    }

    // Calculate SHA256
    const encoder = new TextEncoder();
    const data = encoder.encode(hashParams);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const sha256 = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Store in S3
    const key = `j/${sha256}`;
    const { PutObjectCommand } = await s3Mod();
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: hashParams,
      ContentType: "text/plain; charset=utf-8",
    });
    await s3.send(command);

    // Eagerly derive the frame's favicon and og sidecar (best-effort, neither
    // throws). The content is immutable, so both compute once and store
    // permanently. The sidecar is what keeps the /j/<sha256> page from having
    // to read this whole blob just for its <meta> tags — see ogSidecarKey.
    await generateFaviconForSha256(sha256, hashParams);
    await writeOgSidecar(sha256, hashParams);

    const protocol = c.req.header("x-forwarded-proto") || "https";
    const host = c.req.header("host");
    const origin = `${protocol}://${host}`;

    track(c, { name: "shorten", source: detectSource(c) });

    return c.json({
      id: sha256,
      shortUrl: `${origin}/j/${sha256}`,
      fullUrl: `${origin}/#${hashParams}`,
      hashParams,
    });
  } catch (error) {
    console.error("Shorten JSON error:", error);
    return c.json({ error: "Failed to shorten URL" }, 500);
  }
});

// Save a mutable framejs.app frame. The body is either the editor's current
// hash-param string (`hashParams`) or the frame as plain JSON (`frame`: the
// {js, modules, inputs, og, ...} shape framejs.app's `POST /j/<uuid>.json`
// expects — what an external app's "Open in framejs" export sends, see
// docs/ai/export-from-your-app.md), plus an optional existing frame `id`:
//   - with a uuid `id` (page loaded from /j/<uuid>): update that frame in place
//   - without one (raw hash params or legacy /j/<sha256>): mint a new frame
//   - with anything else as `id`: 400, rather than silently minting a new frame
// It is forwarded server-side because framejs.app serves no CORS; this route is
// CORS-open, so any page can read back the stable framejs.app URL it returns.
app.post("/api/frame", async (c) => {
  try {
    const { status, body } = await saveFrame(
      await c.req.json().catch(() => null),
      {
        appOrigin: FRAMEJS_APP_ORIGIN,
        decodeHashParams: decodeHashParamsToJson,
      },
    );
    if (status === 200) {
      track(c, { name: "save-frame", source: detectSource(c) });
    }
    return c.json(body, status);
  } catch (error) {
    console.error("Save frame error:", error);
    return c.json({ error: "Failed to save frame" }, 500);
  }
});

// ---------------------------------------------------------------------------
// Standalone HTML export (POST /api/export/html, GET /html/:sha256).
//
// Bakes a frame — runtime, code, every module and input — into ONE .html file
// that needs no network to run (see src/standalone-export.ts), for archiving.
// The file is stored content-addressed at `html/<sha256 of the file>`: an
// export that already exists is not uploaded again, and the link to it is
// stable. It is built and hashed in memory and never written to local disk,
// so there is no local copy to clean up. Exports expire 30 days after upload
// (a bucket lifecycle rule on `html/`: seaweedfs-init in docker-compose.yml
// locally, see docs/development/deployment.md for R2) — the downloaded file is
// the archive, the server copy a convenience. Exporting again re-uploads it.
// ---------------------------------------------------------------------------

// Where the export fetches what a frame references. A file uploaded to this
// worker's store (`/f/<id>`, relative or on this origin, or its public bucket
// URL) is read straight from S3 — the worker cannot necessarily reach its own
// public origin. Everything else goes over the public internet, guarded.
const exportFetchAsset = (requestOrigin: string): FetchAsset => {
  const publicFetch = createPublicFetch();
  const ownHosts = new Set(
    [requestOrigin, PUBLIC_ORIGIN].map((o) => new URL(o).host),
  );
  return async (url, options) => {
    const parsed = new URL(url);
    let fileId: string | undefined;
    if (S3_PUBLIC_URL && url.startsWith(`${S3_PUBLIC_URL}/`)) {
      fileId = url.slice(S3_PUBLIC_URL.length + 1).split(/[?#]/)[0];
    } else if (ownHosts.has(parsed.host)) {
      fileId = /^\/f\/([^/]+)$/.exec(parsed.pathname)?.[1];
    }
    // Only ever a plain `f/<id>` key: nothing here can name another prefix.
    if (fileId && !/^[A-Za-z0-9._-]+$/.test(fileId)) fileId = undefined;
    const s3 = fileId ? await getS3Client() : null;
    if (!fileId || !s3) return publicFetch(url, options);
    const { GetObjectCommand } = await s3Mod();
    const response = await s3.send(
      new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: `f/${fileId}` }),
    );
    if (!response.Body) throw new ExportError(`File ${url} is empty`);
    if (
      options?.maxBytes !== undefined &&
      (response.ContentLength ?? Infinity) > options.maxBytes
    ) {
      await response.Body.transformToWebStream().cancel();
      throw new ExportError(`${url} is larger than the export size limit`, 413);
    }
    return {
      url,
      bytes: await response.Body.transformToByteArray(),
      contentType: response.ContentType || "application/octet-stream",
    };
  };
};

const exportHtmlKey = (sha256: string) => `html/${sha256}`;
let activeExports = 0;

app.post("/api/export/html", async (c) => {
  const s3 = await getS3Client();
  if (!s3) {
    return c.json({ error: "Export not configured" }, 503);
  }

  const body = await c.req.json().catch(() => null);
  const hashParams = body?.hashParams;
  if (!hashParams || typeof hashParams !== "string") {
    return c.json({ error: "Missing required field: hashParams" }, 400);
  }

  if (activeExports >= EXPORT_HTML_MAX_CONCURRENT) {
    return c.json(
      { error: "Too many exports in progress — try again in a moment" },
      429,
    );
  }

  // The host the browser used: behind a proxy that is x-forwarded-host. It is
  // what relative and same-origin `/f/<id>` references in the frame mean, and
  // nothing else: being client-controlled, it is never recorded in the file
  // or used in the returned link (PUBLIC_ORIGIN is).
  const protocol = c.req.header("x-forwarded-proto") || "https";
  const host = c.req.header("x-forwarded-host") || c.req.header("host");
  const origin = `${protocol}://${host}`;
  const maxBytes = EXPORT_HTML_MAX_SIZE_MB * 1024 * 1024;
  const tooLarge = () =>
    c.json(
      {
        error:
          `The exported file is larger than the ${EXPORT_HTML_MAX_SIZE_MB}MB limit`,
      },
      413,
    );

  activeExports++;
  try {
    const html = await buildStandaloneHtml({
      params: decodeHashParamsToJson(hashParams),
      runtimeHtml: await Deno.readTextFile("./index.html"),
      faviconSvg: await Deno.readTextFile("./static/favicon.svg").catch(() =>
        undefined
      ),
      origin,
      publicOrigin: PUBLIC_ORIGIN,
      fetchAsset: withBudget(exportFetchAsset(origin), maxBytes),
      encodeHashParams: jsonToHashParams,
    });

    // A string's length never exceeds its UTF-8 size: refuse before copying.
    if (html.length > maxBytes) return tooLarge();
    const bytes = new TextEncoder().encode(html);
    if (bytes.byteLength > maxBytes) return tooLarge();
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const key = exportHtmlKey(sha256);

    // Content-addressed: if it is there, it is this exact file.
    const { HeadObjectCommand, PutObjectCommand } = await s3Mod();
    let existed = true;
    try {
      await s3.send(
        new HeadObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }),
      );
    } catch {
      existed = false;
    }
    if (!existed) {
      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key,
          Body: bytes,
          ContentType: "text/html; charset=utf-8",
        }),
      );
    }

    track(c, { name: "export-html", source: detectSource(c) });

    return c.json({
      id: sha256,
      path: `/html/${sha256}`,
      url: `${PUBLIC_ORIGIN}/html/${sha256}`,
      size: bytes.byteLength,
      existed,
    });
  } catch (error) {
    if (error instanceof ExportError) {
      return c.json({ error: error.message }, error.status);
    }
    console.error("Export HTML error:", error);
    return c.json({ error: "Failed to export HTML" }, 500);
  } finally {
    activeExports--;
  }
});

// Downloads an export. `?inline` opens it in the browser instead.
app.get("/html/:sha256", async (c) => {
  const sha256 = c.req.param("sha256").replace(/\.html$/, "");
  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    return c.json({ error: "Invalid export id" }, 400);
  }
  const s3 = await getS3Client();
  if (!s3) {
    return c.json({ error: "Export not configured" }, 503);
  }
  try {
    const { GetObjectCommand } = await s3Mod();
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: exportHtmlKey(sha256),
      }),
    );
    if (!response.Body) throw new Error("S3 response body is empty");
    const filename = `framejs-${sha256.slice(0, 12)}.html`;
    const headers: Record<string, string> = {
      "Content-Type": "text/html; charset=utf-8",
      // Content-addressed, so it can never change.
      "Cache-Control": "public, max-age=31536000, immutable",
    };
    if (c.req.query("inline") === undefined) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }
    if (response.ContentLength !== undefined) {
      headers["Content-Length"] = String(response.ContentLength);
    }
    return new Response(
      response.Body.transformToWebStream() as ReadableStream,
      { headers },
    );
  } catch (error: any) {
    if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
      return c.json({ error: "Export not found" }, 404);
    }
    console.error("Export download error:", error);
    return c.json({ error: "Failed to download export" }, 500);
  }
});

// Builds the hash-param string a /j/:uuid page should resolve to. Fetches
// `${FRAMEJS_APP_ORIGIN}/<uuid>`, expecting a 200 JSON object of hash-param values
// (e.g. {js, modules, inputs, og}), and encodes it to a hash-param string.
// Returns null when the backend has no frame for that uuid (non-200 response).
//
// framejs.app also returns a reserved `branding` field for a free-tier frame's
// LIVE version (the "Made with framejs" overlay HTML). It is NOT frame content,
// so it's split out here and never encoded into the hash params — the caller
// injects it separately. Pinned (?v=) versions never carry it.
/**
 * Just a uuid frame's og metadata, for the `<meta>` tags and favicon link on a
 * `/j/<uuid>` page. Read off framejs.app's `frame_versions.og` column via
 * `/j/<uuid>/og.json` — no url decode, no `js` dereference.
 *
 * The page used to get this out of `fetchUuidHashParams`, i.e. the full params
 * endpoint, while the browser separately fetched the same content for the
 * runtime. A megabyte-class frame was therefore resolved twice per page load to
 * produce ~200 bytes of markup. Same fix as the sha256 side's `og/<sha256>`
 * sidecar (see ogSidecarKey); on this side the column already exists.
 *
 * null means "no such frame, as far as a renderer is concerned" — framejs.app
 * applies the same privacy gate as the params endpoint (a pin resolves even for
 * a now-private frame; otherwise it must be live and public), so the caller
 * turns this into the page's 404.
 */
async function fetchUuidOg(
  uuid: string,
  version?: string,
): Promise<Record<string, unknown> | null> {
  const url = `${FRAMEJS_APP_ORIGIN}${
    frameOgPath(normalizeUuid(uuid), version)
  }`;
  const response = await fetch(url);
  if (response.status !== 200) {
    // Drain the body so the connection can be reused.
    await response.body?.cancel();
    return null;
  }
  const json = await response.json() as Record<string, unknown>;
  // Passed through whole rather than picking out `og`: the result is shaped like
  // a decoded-params record, so it drops into buildOgMetaTags (which reads
  // nothing but `.og` — pinned by a test in src/og_test.ts), AND a `branding`
  // field stays visible to extractBranding if the overlay is ever re-enabled.
  return { ...json, og: json?.og ?? null };
}

/**
 * The hash-param string a /j/:uuid page should resolve to, fetched from
 * framejs.app's `/j/<uuid>/params` — the params EXACTLY AS STORED.
 *
 * Returns null when there is no frame a renderer may have (non-200): no such
 * uuid, or one that is private or soft-deleted. Callers turn that into a 404
 * rather than serving a page.
 *
 * It deliberately does NOT use `/j/<uuid>.json`, which promises SOURCE and so
 * dereferences a hoisted `js`. That is right for its own consumers — the agent
 * skill, MCP, scripts — because they read-modify-write and would otherwise save
 * the `/f/<id>` reference as the frame's code. It is wrong for us: we never
 * write back, and dereferencing undoes the hoist. Measured on one frame, a
 * 292-char stored url came back as 1.13 MB of params, which this worker then
 * inlined into 1.25 MB of uncacheable HTML on every page load.
 *
 * It is also a passthrough now. The previous path decoded that JSON and
 * immediately re-encoded it with `jsonToHashParams`; the stored string needs
 * neither step.
 *
 * NOTE — `branding`: the free-tier "Made with framejs" overlay used to ride
 * along as a reserved field of the JSON response, and this function split it
 * out for the caller. A params endpoint carries params only, so that is gone.
 * It is currently disabled on framejs.app anyway (see the `brandingForOwner`
 * block in its routes/j/[uuid].json.ts); re-enabling it needs a channel of its
 * own, not a smuggled field.
 */
async function fetchUuidHashParams(
  uuid: string,
  // When set, fetch a specific PUBLISHED version (permanent pin) instead of the
  // current one: framejs.app serves a retention>0 version even if the frame is
  // later made private or deleted.
  version?: string,
): Promise<{ hashParams: string } | null> {
  const url = `${FRAMEJS_APP_ORIGIN}/j/${normalizeUuid(uuid)}/params${
    pinnedVersionSuffix(version)
  }`;
  const response = await fetch(url);
  if (response.status !== 200) {
    // Drain the body so the connection can be reused.
    await response.body?.cancel();
    return null;
  }
  return { hashParams: await response.text() };
}

/**
 * A frame's stored hash params, by uuid (framejs.app, honoring a `?v=` pin) or
 * sha256 (S3). `immutable` is whether they can ever change: a sha256 blob is
 * content-addressed and a pinned version is permanent; a live uuid is not.
 * null when there is no such frame. The caller validates `id` (a uuid or a
 * sha256) and that storage is configured for a sha256.
 */
async function loadFrameHashParams(
  id: string,
  pinnedVersion?: string,
): Promise<{ hashParams: string; immutable: boolean } | null> {
  if (UUID_REGEX.test(id)) {
    const fetched = await fetchUuidHashParams(id, pinnedVersion);
    return fetched &&
      { hashParams: fetched.hashParams, immutable: !!pinnedVersion };
  }
  const s3 = await getS3Client();
  if (!s3) throw new Error("URL shortening not configured");
  try {
    const { GetObjectCommand } = await s3Mod();
    const response = await s3.send(
      new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: `j/${id}` }),
    );
    if (!response.Body) throw new Error("S3 response body is empty");
    return {
      hashParams: await response.Body.transformToString(),
      immutable: true,
    };
  } catch (error: any) {
    if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") return null;
    throw error;
  }
}

/** Cap on a hoisted (`js=<url>`) source fetched for `/j/<id>.js`. */
const MODULE_SOURCE_MAX_BYTES = 10 * 1024 * 1024;

/**
 * `/j/<id>.js` (and `/j/<uuid>.js?v=<sha256>`): the frame's code as an ES
 * module of its functions only, so another frame can
 * `import { f } from "https://framejs.io/j/<id>.js"`. What survives is decided
 * by extractModule (src/module-export.ts).
 */
async function serveFrameModule(c: Context, id: string): Promise<Response> {
  // User code at a stable same-origin path could be registered as a service
  // worker scoped to /j/ — over every other frame's page. A module import never
  // sends this header; a service worker registration always does.
  if (c.req.header("service-worker")) {
    return c.json({ error: "Not available as a service worker" }, 403);
  }
  id = normalizeUuid(id);
  const isUuid = UUID_REGEX.test(id);
  if (!isUuid && !/^[a-f0-9]{64}$/.test(id)) {
    return c.json({ error: "Invalid shortened URL ID" }, 400);
  }
  if (!isUuid && !s3Configured) {
    return c.json({ error: "URL shortening not configured" }, 503);
  }
  const pinnedVersion = pinnedVersionFromQuery((k) => c.req.query(k));
  let frame: { hashParams: string; immutable: boolean } | null;
  let source: string;
  try {
    frame = await loadFrameHashParams(id, pinnedVersion);
    if (frame === null) {
      return c.json({ error: "Shortened URL not found" }, 404);
    }
    const js = decodeHashParamsToJson(frame.hashParams).js;
    source = typeof js === "string" ? js : "";
    if (!source.trim()) {
      return c.json({ error: "This frame has no code" }, 404);
    }
    // A hoisted frame stores `js=<url>` of its source.
    const protocol = c.req.header("x-forwarded-proto") || "https";
    const host = c.req.header("x-forwarded-host") || c.req.header("host");
    source = await resolveJsSource(
      source,
      withBudget(
        exportFetchAsset(`${protocol}://${host}`),
        MODULE_SOURCE_MAX_BYTES,
      ),
    );
  } catch (error) {
    if (error instanceof ExportError) {
      return c.json({ error: error.message }, error.status);
    }
    console.error("Frame module error:", error);
    return c.json({ error: "Failed to retrieve frame" }, 502);
  }

  let body: string;
  try {
    const { code, skipped } = extractModule(source);
    const canonical = `${PUBLIC_ORIGIN}/j/${id}.js${
      pinnedVersionSuffix(pinnedVersion)
    }`;
    body = `// ${canonical}\n` +
      `// The functions of this frame's code: top-level code is removed.\n` +
      (skipped.length
        ? `// Not exported (not functions): ${skipped.join(", ")}\n`
        : "") +
      `\n${code}`;
  } catch (error) {
    if (error instanceof ModuleExportError) {
      return c.json({ error: error.message }, 422);
    }
    throw error;
  }

  track(c, { name: "module", source: detectSource(c) });
  const headers: Record<string, string> = {
    "Content-Type": "text/javascript; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  };
  if (frame.immutable) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
    return new Response(body, { headers });
  }
  // Live uuid: revalidate every import, but answer 304 when unchanged.
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body),
  );
  const etag = `"${
    Array.from(new Uint8Array(digest)).slice(0, 16).map((b) =>
      b.toString(16).padStart(2, "0")
    ).join("")
  }"`;
  headers["ETag"] = etag;
  headers["Cache-Control"] = "no-cache";
  if (c.req.header("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(body, { headers });
}

// Shortened URL — fetches hash params and serves index.html with injected init
// script. Accepts either a sha256 (S3-backed blob) or a uuid (resolved via
// FRAMEJS_APP_ORIGIN).
app.get("/j/:sha256", async (c) => {
  const id = c.req.param("sha256");

  // .js form: the frame's functions as an importable ES module.
  if (id && id.endsWith(".js")) {
    return await serveFrameModule(c, id.slice(0, -".js".length));
  }

  // uuid.json form: proxy the raw frame JSON to the framejs.app backend (or the
  // dev-stack equivalent via FRAMEJS_APP_ORIGIN) so callers can fetch a frame's
  // {js, modules, inputs, og} JSON same-origin, without hitting framejs.app CORS.
  if (id && id.endsWith(".json")) {
    const uuid = normalizeUuid(id.slice(0, -".json".length));
    if (!UUID_REGEX.test(uuid)) {
      return c.json({ error: "Invalid frame id" }, 400);
    }
    try {
      // Forward ?v=<sha256> (or the ?sha256= alias) so a pinned version
      // proxies through too.
      const suffix = pinnedVersionSuffix(
        pinnedVersionFromQuery((k) => c.req.query(k)),
      );
      const upstream = `${FRAMEJS_APP_ORIGIN}/j/${uuid}.json${suffix}`;
      const response = await fetch(upstream);
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") ??
            "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error("Proxy frame JSON error:", error);
      return c.json({ error: "Failed to fetch frame" }, 502);
    }
  }

  // uuid form: resolve via FRAMEJS_APP_ORIGIN, then rewrite the URL to the base
  // /#?hash-params (dropping the /j/:uuid path entirely).
  if (id && UUID_REGEX.test(id)) {
    try {
      track(c); // pageview — short URL opened (shared app load)
      const embedOrigin = detectEmbed(c);
      if (embedOrigin) {
        track(c, { name: "embed", source: "browser", embedOrigin });
      }

      // A pinned request /j/<uuid>?v=<sha256> (or the ?sha256= alias) renders
      // one exact PUBLISHED version (immutable, permanently public — resolves
      // even if the frame is now private or deleted). Absent a pin, render the
      // current version.
      const pinnedVersion = pinnedVersionFromQuery((k) => c.req.query(k));

      // og ONLY — the page needs the <meta> tags and whether there is an og
      // image, nothing else. The runtime's params are fetched by the browser
      // from /api/j/<id>/runtime-params, so resolving the full content here too
      // meant doing it twice per page load. See fetchUuidOg.
      const decoded = await fetchUuidOg(id, pinnedVersion);
      if (decoded === null) {
        return c.json({ error: "Shortened URL not found" }, 404);
      }

      const ogMetaTags = buildOgMetaTags(decoded);
      // This is a framejs.app-owned frame; its derived favicon lives there. Point
      // the tab icon at framejs.app's endpoint (cross-origin) when it has an og
      // image; degrades to the default if unreachable/not yet generated. For a
      // pin, request the pinned version's favicon so the tab icon matches it.
      const favicon = (decoded.og as { image?: string } | undefined)?.image
        ? `<link rel="icon" type="image/png" sizes="any" href="${FRAMEJS_APP_ORIGIN}/j/${id}/favicon.png${
          pinnedVersionSuffix(pinnedVersion)
        }" />\n`
        : "";

      // Free-tier "Made with framejs" overlay. Currently always absent: the
      // overlay is disabled on framejs.app (see the brandingForOwner block in
      // its routes/j/[uuid].json.ts), and this page now reads og from
      // /j/<uuid>/og.json rather than the full params endpoint — so if the
      // overlay is re-enabled, og.json has to return `branding` and it gets
      // picked up here. Self-contained markup from our own origin when it does.
      const branding = extractBranding(
        decoded as Record<string, unknown>,
      );
      const brandingOverlay = branding ? brandingScript(branding) : "";

      // The params themselves are fetched, not inlined — see
      // shortUrlInitScript. `__SHORT_URL_VERSION` carries the pin so the edit
      // button can hand off to framejs.app's page for THIS version; a pinned
      // frame renders with no banner or chrome here, because the "published
      // version" label belongs to the framejs.app page.
      //
      // They are also never written into the URL: the uuid already identifies
      // the frame, so expanding them into the address bar (and stripping them
      // again after the code ran) only flashed the base64 payload at the user.
      const injectedScript = shortUrlInitScript(
        id,
        FRAMEJS_APP_ORIGIN,
        pinnedVersion,
      );

      return await serveShortUrlHtml(
        ogMetaTags,
        injectedScript + brandingOverlay,
        favicon,
      );
    } catch (error) {
      console.error("UUID shortened URL error:", error);
      return c.json({ error: "Failed to retrieve shortened URL" }, 500);
    }
  }

  // sha256 form: resolve via S3.
  const s3 = await getS3Client();
  if (!s3) {
    return c.json({ error: "URL shortening not configured" }, 503);
  }

  try {
    const sha256 = id;

    // Validate sha256 format (64 hex characters)
    if (!sha256 || !/^[a-f0-9]{64}$/.test(sha256)) {
      return c.json({ error: "Invalid shortened URL ID" }, 400);
    }

    track(c); // pageview — short URL opened (shared app load)
    const embedOrigin = detectEmbed(c);
    if (embedOrigin) {
      track(c, { name: "embed", source: "browser", embedOrigin });
    }

    // The page needs only the og metadata: the <meta> tags and whether there
    // is an og image. Read the sidecar for it rather than the whole blob —
    // the browser fetches the blob itself via /api/j/<sha>/runtime-params, so
    // decoding it here too meant reading a megabyte-class frame out of S3
    // twice per page load. See ogSidecarKey.
    let decoded = await readOgSidecar(sha256);

    if (!decoded) {
      // No sidecar: either a frame shortened before sidecars shipped, or no
      // such frame. Read the blob — which also settles existence, since a
      // missing one throws NoSuchKey and is handled as a 404 below.
      const { GetObjectCommand } = await s3Mod();
      const response = await s3.send(
        new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: `j/${sha256}` }),
      );
      if (!response.Body) throw new Error("S3 response body is empty");
      const hashParams = await response.Body.transformToString();
      decoded = decodeHashParamsToJson(hashParams);
      // Backfill so this frame costs the full read once, not forever.
      await writeOgSidecar(sha256, hashParams);
    }

    const ogMetaTags = buildOgMetaTags(decoded);
    // Point the tab favicon at this frame's derived favicon (same-origin) when it
    // has an og image; the serve route falls back to the default until it exists.
    const favicon = (decoded.og as { image?: string } | undefined)?.image
      ? `<link rel="icon" type="image/png" sizes="any" href="/j/${sha256}/favicon.png" />\n`
      : "";

    // Same init script as the uuid handler — one shape for both short-URL
    // forms. A sha256 blob is content-addressed and therefore never pinned.
    const injectedScript = shortUrlInitScript(sha256, FRAMEJS_APP_ORIGIN);

    return await serveShortUrlHtml(ogMetaTags, injectedScript, favicon);
  } catch (error: any) {
    console.error("Shortened URL error:", error);

    // Handle S3 NoSuchKey error (404)
    if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
      return c.json({ error: "Shortened URL not found" }, 404);
    }

    return c.json({ error: "Failed to retrieve shortened URL" }, 500);
  }
});

// Short URL QR code — returns a PNG QR code encoding the short URL /j/<sha256>.
// Any extra query params on this request are appended to the encoded URL, so
// QR codes for these short URLs can be dynamically embedded (e.g. in an <img>).
app.get("/j/:sha256/qrcode.png", async (c) => {
  try {
    const id = c.req.param("sha256");

    if (!id || (!/^[a-f0-9]{64}$/.test(id) && !UUID_REGEX.test(id))) {
      return c.json({ error: "Invalid shortened URL ID" }, 400);
    }

    // Pin the canonical origin so the QR encodes a stable, public URL
    // regardless of which host (alias, *.deno.dev, etc.) served the request.
    const target = new URL(`${PUBLIC_ORIGIN}/j/${id}`);

    // Forward any extra query params onto the encoded URL.
    const incoming = new URL(c.req.url);
    for (const [key, value] of incoming.searchParams) {
      target.searchParams.append(key, value);
    }

    const { default: QRCode } = await import("qrcode");
    const png = await QRCode.toBuffer(target.toString(), {
      type: "png",
      errorCorrectionLevel: "M",
      margin: 2,
      width: 512,
    });

    return new Response(new Blob([png], { type: "image/png" }), {
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Short URL QR code error:", error);
    return c.json({ error: "Failed to generate QR code" }, 500);
  }
});

// Per-frame favicon — returns the derived favicon (the frame's og image,
// full-bleed). Normally generated eagerly at shorten time; on a miss this path
// generates once, lazily, then serves (self-healing for frames shortened before
// generation existed, or via a path whose og didn't decode). sha256 content is
// immutable, so the stored favicon is permanent and served with immutable cache.
app.get("/j/:sha256/favicon.png", async (c) => {
  const sha256 = c.req.param("sha256");
  const fallback = () => c.redirect("/favicon.ico", 302);

  if (!sha256 || !/^[a-f0-9]{64}$/.test(sha256)) {
    return fallback();
  }
  const s3 = await getS3Client();
  if (!s3) return fallback();

  // Load the stored favicon PNG, or null if it doesn't exist yet.
  const loadFavicon = async (): Promise<ArrayBuffer | null> => {
    try {
      const { GetObjectCommand } = await s3Mod();
      const response = await s3.send(
        new GetObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: `favicon/${sha256}`,
        }),
      );
      if (!response.Body) return null;
      const bytes = await response.Body.transformToByteArray();
      // Copy into a fresh ArrayBuffer-backed buffer so the body type is concrete.
      return new Uint8Array(bytes).buffer;
    } catch {
      return null;
    }
  };

  const serve = (body: ArrayBuffer) =>
    new Response(body, {
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });

  const existing = await loadFavicon();
  if (existing) return serve(existing);

  // Miss — generate lazily from the stored hash params (best-effort), then retry.
  try {
    const { GetObjectCommand } = await s3Mod();
    const response = await s3.send(
      new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: `j/${sha256}` }),
    );
    if (response.Body) {
      const hashParams = await response.Body.transformToString();
      await generateFaviconForSha256(sha256, hashParams);
      const generated = await loadFavicon();
      if (generated) return serve(generated);
    }
  } catch {
    // No stored frame / generation failed — the default favicon applies.
  }
  return fallback();
});

// Short URL metaframe.json — computes effective definition from stored hash params
app.get("/j/:sha256/metaframe.json", async (c) => {
  try {
    const id = c.req.param("sha256");

    if (id && UUID_REGEX.test(id)) {
      // Honor a pin so an embedded PUBLISHED version's definition stays fixed to
      // that snapshot rather than tracking the current version.
      const fetched = await fetchUuidHashParams(
        id,
        pinnedVersionFromQuery((k) => c.req.query(k)),
      );
      if (fetched === null) {
        return c.json({ error: "Shortened URL not found" }, 404);
      }
      const hashParams = fetched.hashParams;
      return c.json(computeMetaframeDefinition(hashParams));
    }

    const s3 = await getS3Client();
    if (!s3) {
      return c.json({ error: "URL shortening not configured" }, 503);
    }

    if (!id || !/^[a-f0-9]{64}$/.test(id)) {
      return c.json({ error: "Invalid shortened URL ID" }, 400);
    }

    const key = `j/${id}`;
    const { GetObjectCommand } = await s3Mod();
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3.send(command);
    if (!response.Body) throw new Error("S3 response body is empty");
    const hashParams = await response.Body.transformToString();

    const definition = computeMetaframeDefinition(hashParams);
    c.header("Cache-Control", "public, max-age=31536000, immutable");
    return c.json(definition);
  } catch (error: any) {
    console.error("Short URL metaframe.json error:", error);

    if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
      return c.json({ error: "Shortened URL not found" }, 404);
    }

    return c.json({ error: "Failed to retrieve shortened URL" }, 500);
  }
});

// Short URL JSON API — returns id and hashParams for a given sha256
app.get("/api/j/:sha256", async (c) => {
  try {
    const id = c.req.param("sha256");

    if (id && UUID_REGEX.test(id)) {
      // Honor a pin so a PUBLISHED version's decoded params stay fixed.
      const fetched = await fetchUuidHashParams(
        id,
        pinnedVersionFromQuery((k) => c.req.query(k)),
      );
      if (fetched === null) {
        return c.json({ error: "Shortened URL not found" }, 404);
      }
      const hashParams = fetched.hashParams;
      track(c, { name: "fetch", source: detectSource(c) });
      return c.json({ id, hashParams: decodeHashParamsToJson(hashParams) });
    }

    const s3 = await getS3Client();
    if (!s3) {
      return c.json({ error: "URL shortening not configured" }, 503);
    }

    if (!id || !/^[a-f0-9]{64}$/.test(id)) {
      return c.json({ error: "Invalid shortened URL ID" }, 400);
    }

    const key = `j/${id}`;
    const { GetObjectCommand } = await s3Mod();
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3.send(command);
    if (!response.Body) throw new Error("S3 response body is empty");
    const hashParams = await response.Body.transformToString();

    track(c, { name: "fetch", source: detectSource(c) });

    c.header("Cache-Control", "public, max-age=31536000, immutable");
    return c.json({ id, hashParams: decodeHashParamsToJson(hashParams) });
  } catch (error: any) {
    console.error("Short URL API error:", error);

    if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
      return c.json({ error: "Shortened URL not found" }, 404);
    }

    return c.json({ error: "Failed to retrieve shortened URL" }, 500);
  }
});

/**
 * The hash params a short-URL page's RUNTIME should be handed, as plain text
 * ("?js=...&og=..." or ""). What `shortUrlInitScript`'s fetch consumes, for
 * both the uuid and sha256 forms.
 *
 * This exists rather than reusing `/api/j/:id/url` for two reasons:
 *
 *  1. It returns `runtimeHashParams(...)` — `edit` and `readonly` stripped, and
 *     `readonly=true` re-added for a pin. The page handler used to apply that
 *     itself before inlining; now that the browser fetches the params, the
 *     cleaning has to happen here or a stored `edit=true` would drag the page
 *     straight back out of short-URL mode, and a pinned (immutable) version
 *     would open writable.
 *  2. `/api/j/:id/url` is a published contract that returns a FULL URL. Leaving
 *     it alone keeps its consumers working.
 *
 * Caching is the real win over inlining, and it differs by what the id names:
 *  - sha256: content-addressed, so the params can never change -> immutable.
 *  - uuid + pin: a published version is permanent -> immutable.
 *  - uuid, live: mutable, so revalidate. The ETag makes the repeat load a ~150
 *    byte 304 instead of the whole payload, which is what the HTML (always
 *    `no-cache`) could never do while the params were inlined in it.
 */
app.get("/api/j/:sha256/runtime-params", async (c) => {
  const id = c.req.param("sha256");
  const pinnedVersion = pinnedVersionFromQuery((k) => c.req.query(k));

  let raw: string | null = null;
  let immutable = false;

  if (id && UUID_REGEX.test(id)) {
    try {
      const fetched = await fetchUuidHashParams(id, pinnedVersion);
      if (fetched === null) {
        return c.json({ error: "Shortened URL not found" }, 404);
      }
      raw = fetched.hashParams;
      // A pin names one published version, which is permanent and immutable.
      immutable = !!pinnedVersion;
    } catch (error) {
      console.error("Runtime params (uuid) error:", error);
      return c.json({ error: "Failed to retrieve frame params" }, 502);
    }
  } else if (id && /^[a-f0-9]{64}$/.test(id)) {
    const s3 = await getS3Client();
    if (!s3) {
      return c.json({ error: "URL shortening not configured" }, 503);
    }
    try {
      const { GetObjectCommand } = await s3Mod();
      const response = await s3.send(
        new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: `j/${id}` }),
      );
      if (!response.Body) throw new Error("S3 response body is empty");
      raw = await response.Body.transformToString();
      immutable = true; // content-addressed
    } catch (error: any) {
      if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
        return c.json({ error: "Shortened URL not found" }, 404);
      }
      console.error("Runtime params (sha256) error:", error);
      return c.json({ error: "Failed to retrieve frame params" }, 500);
    }
  } else {
    return c.json({ error: "Invalid shortened URL ID" }, 400);
  }

  const body = runtimeHashParams(raw, pinnedVersion);

  c.header("Content-Type", "text/plain; charset=utf-8");
  if (immutable) {
    c.header("Cache-Control", "public, max-age=31536000, immutable");
    return c.text(body);
  }

  // Live version: revalidate every load, but answer 304 when unchanged.
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body),
  );
  const etag = `"${
    Array.from(new Uint8Array(digest)).slice(0, 16).map((b) =>
      b.toString(16).padStart(2, "0")
    ).join("")
  }"`;
  c.header("ETag", etag);
  c.header("Cache-Control", "no-cache");
  if (c.req.header("if-none-match") === etag) {
    return c.body(null, 304);
  }
  return c.text(body);
});

// Short URL full-URL API — returns the full URL as plain text for a given sha256
app.get("/api/j/:sha256/url", async (c) => {
  try {
    const id = c.req.param("sha256");

    if (id && UUID_REGEX.test(id)) {
      // Honor a pin so a PUBLISHED version expands to that exact snapshot.
      const fetched = await fetchUuidHashParams(
        id,
        pinnedVersionFromQuery((k) => c.req.query(k)),
      );
      if (fetched === null) {
        return c.json({ error: "Shortened URL not found" }, 404);
      }
      const hashParams = fetched.hashParams;
      const protocol = c.req.header("x-forwarded-proto") || "https";
      const host = c.req.header("host");
      c.header("Content-Type", "text/plain; charset=utf-8");
      return c.text(`${protocol}://${host}/#${hashParams}`);
    }

    const s3 = await getS3Client();
    if (!s3) {
      return c.json({ error: "URL shortening not configured" }, 503);
    }

    if (!id || !/^[a-f0-9]{64}$/.test(id)) {
      return c.json({ error: "Invalid shortened URL ID" }, 400);
    }

    const key = `j/${id}`;
    const { GetObjectCommand } = await s3Mod();
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3.send(command);
    if (!response.Body) throw new Error("S3 response body is empty");
    const hashParams = await response.Body.transformToString();

    const protocol = c.req.header("x-forwarded-proto") || "https";
    const host = c.req.header("host");
    const fullUrl = `${protocol}://${host}/#${hashParams}`;

    c.header("Cache-Control", "public, max-age=31536000, immutable");
    c.header("Content-Type", "text/plain; charset=utf-8");
    return c.text(fullUrl);
  } catch (error: any) {
    console.error("Short URL API error:", error);

    if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
      return c.json({ error: "Shortened URL not found" }, 404);
    }

    return c.json({ error: "Failed to retrieve shortened URL" }, 500);
  }
});

// File download endpoint — redirects to the public S3 URL.
// Because this is a redirect and not a proxy, the browser's CORS check applies
// to the *bucket's* response, not ours. The bucket CORS policy alone is not
// enough: it must send Access-Control-Allow-Origin even when the request has no
// Origin header, or a cached non-CORS load will break later fetch()es.
// See docs/development/deployment.md#file-storage-cloudflare-r2
app.get("/f/:id", (c) => {
  if (!S3_PUBLIC_URL) {
    return c.json(
      { error: "File access not configured (missing S3_PUBLIC_URL)" },
      503,
    );
  }

  try {
    const id = c.req.param("id");
    const publicUrl = getPublicUrl(id);

    c.header("Cache-Control", "public, max-age=3600");
    return c.redirect(publicUrl);
  } catch (error) {
    console.error("File download error:", error);
    return c.json({ error: "Failed to redirect to file" }, 500);
  }
});

// Static file serving
app.use("/editor/*", serveStatic({ root: "./" }));
// /docs (no trailing slash) → /docs/ so VitePress index.html is served
app.get("/docs", (c) => c.redirect("/docs/", 301));
// Standalone slide decks live in docs/public/presentations/<deck>/index.html.
// They are directories, not cleanUrl pages, so a missing trailing slash would
// otherwise be rewritten to `<deck>.html` and 404.
app.get(
  "/docs/presentations/:deck",
  (c) => c.redirect(`/docs/presentations/${c.req.param("deck")}/`, 301),
);
// Docs are built by VitePress with cleanUrls (links have no .html suffix).
// Serve `foo.html` for a request to `/docs/foo` so those clean URLs resolve.
// Leave paths with an extension (.html, .js, .css, …) and directory paths
// (trailing slash → index.html) untouched.
app.use(
  "/docs/*",
  serveStatic({
    root: "./",
    rewriteRequestPath: (path) =>
      path.endsWith("/") || /\.[^/]+$/.test(path) ? path : `${path}.html`,
  }),
);
app.use(
  "/*",
  serveStatic({
    root: "./",
    rewriteRequestPath: (path) => `/static${path}`,
  }),
);

console.log(`🚀 Listening on: http://localhost:${port}`);
Deno.serve({ port }, app.fetch);
