import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";
import QRCode from "qrcode";

import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { serveStatic } from "@hono/hono/deno";
import {
  blobFromBase64String,
  getUrlHashParamsFromHashString,
  stringFromBase64String,
} from "@metapages/hash-query";
import { HashParamType } from "@metapages/metapage";

import { detectEmbed, detectSource, track } from "./src/analytics.ts";
import {
  normalizeUuid,
  resolveSaveUuid,
  UUID_REGEX,
} from "./src/frame-uuid.ts";
import {
  computeMetaframeDefinition,
  DEFAULT_METAFRAME_DEFINITION,
  jsonToHashParams,
  stripDefaultHashParams,
} from "./src/metaframe-definition.ts";

/** Escape a string for safe use inside an HTML attribute (double-quoted). */
function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Builds the Open Graph <meta> tags for a short-URL page from the decoded
 * hash-param values (the `og` field). Falls back to a default title when no
 * og metadata is present.
 */
function buildOgMetaTags(decoded: Record<string, unknown>): string {
  const og = decoded.og as
    | { title?: string; description?: string; image?: string }
    | undefined;
  if (!og || !(og.title || og.description || og.image)) {
    return `<meta property="og:title" content="framejs.io" />\n<meta property="og:description" content="" />\n`;
  }
  let tags = "";
  if (og.title) {
    tags += `<meta property="og:title" content="${
      escapeHtmlAttr(
        og.title,
      )
    }" />\n`;
  }
  if (og.description) {
    tags += `<meta property="og:description" content="${
      escapeHtmlAttr(
        og.description,
      )
    }" />\n`;
  }
  if (og.image) {
    tags += `<meta property="og:image" content="${
      escapeHtmlAttr(
        og.image,
      )
    }" />\n`;
  }
  return tags;
}

/**
 * Reads index.html, strips its default OG block, and injects the given OG meta
 * tags plus a bootstrap <script> just before </head>. Returns the HTML Response
 * used to serve a short-URL page.
 */
async function serveShortUrlHtml(
  ogMetaTags: string,
  injectedScript: string,
): Promise<Response> {
  const indexHtml = await Deno.readTextFile("./index.html");
  const ogStripped = indexHtml.replace(
    /<!-- OG_START -->[\s\S]*?<!-- OG_END -->/,
    "",
  );
  const modifiedHtml = ogStripped.replace(
    "</head>",
    ogMetaTags + injectedScript + "\n</head>",
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
  const [, hashObject] = getUrlHashParamsFromHashString(hashParams);

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

// Canonical hash param keys — these are stored in the short URL and cleaned
// from the URL bar after load. Any other keys are treated as user-defined
// state and preserved in the URL.
// NOTE: Keep in sync with editor/src/utils/hashParams.ts (DEFAULT_ALLOWED_HASH_PARAMS).
const CANONICAL_HASH_PARAM_KEYS = [
  "bgColor",
  "definition",
  "edit",
  "editorWidth",
  "hm",
  "inputs",
  "js",
  "modules",
  "og",
  "options",
];

const port: number = parseInt(Deno.env.get("PORT") || "3000");

// S3-compatible storage config (works with Cloudflare R2 and MinIO)
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

// Server-side S3 client for actual S3 operations (PutObject, GetObject).
// Uses the internal Docker network endpoint (e.g. http://minio:9000).
let s3Client: S3Client | null = null;
if (s3Credentials && S3_ENDPOINT) {
  s3Client = new S3Client({
    endpoint: S3_ENDPOINT,
    forcePathStyle: true,
    region: "auto",
    credentials: s3Credentials,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  console.log(`S3 client configured: endpoint=${S3_ENDPOINT}`);
}

// Presign client for generating browser-facing presigned URLs.
// Uses S3_PRESIGN_ENDPOINT (browser-reachable, e.g. https://s3.localhost) if set,
// otherwise falls back to S3_ENDPOINT (e.g. production R2 where the endpoint is
// directly reachable from the browser).
let s3PresignClient: S3Client | null = null;
const presignEndpoint = S3_PRESIGN_ENDPOINT || S3_ENDPOINT;
if (s3Credentials && presignEndpoint) {
  s3PresignClient = new S3Client({
    endpoint: presignEndpoint,
    forcePathStyle: true,
    region: "auto",
    credentials: s3Credentials,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  console.log(`S3 presign client configured: endpoint=${presignEndpoint}`);
}

const app = new Hono();

// Global CORS
app.use("*", cors({ origin: "*" }));

// Routes
let indexHtmlProcessed = "";
const serveIndex = async () => {
  if (!indexHtmlProcessed) {
    const indexHtml = await Deno.readTextFile("./index.html");
    // Expose the configured framejs.app origin to the client so it can link/
    // navigate to the right host in dev vs prod (the client reads
    // window.__FRAMEJS_APP_ORIGIN, falling back to the prod default). The editor
    // iframe reads it from window.parent.
    const withOrigin = indexHtml.replace(
      "</head>",
      `<script id="framejs-app-origin-init">window.__FRAMEJS_APP_ORIGIN=${
        JSON.stringify(FRAMEJS_APP_ORIGIN)
      }</script>\n</head>`,
    ).replaceAll("https://framejs.app", FRAMEJS_APP_ORIGIN);
    if (Deno.env.get("DEV") === "true") {
      // don't cache the index.html in dev
      return new Response(indexHtmlProcessed, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    indexHtmlProcessed = withOrigin;
  }
  return new Response(indexHtmlProcessed, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

app.get("/", (c) => {
  track(c); // pageview — main app load
  const embedOrigin = detectEmbed(c);
  if (embedOrigin) {
    // Embedded in an iframe — record the embedding origin so the dashboard can
    // count and break down where the app is being embedded.
    track(c, { name: "embed", source: "browser", embedOrigin });
  }
  return serveIndex();
});
app.get("/index.html", () => serveIndex());

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
  if (!s3PresignClient) {
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

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL using the browser-reachable endpoint
    const presignedUrl = await getSignedUrl(s3PresignClient, command, {
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
  if (!s3Client) {
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
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: hashParams,
      ContentType: "text/plain; charset=utf-8",
    });

    await s3Client.send(command);

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
  if (!s3Client) {
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
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: hashParams,
      ContentType: "text/plain; charset=utf-8",
    });
    await s3Client.send(command);

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

// Save the current editor state as a mutable framejs.app frame. The body is the
// editor's current hash-param string plus an optional existing frame `id`:
//   - with a uuid `id` (page loaded from /j/<uuid>): update that frame in place
//   - without one (raw hash params or legacy /j/<sha256>): mint a new frame
// The hash params are decoded to the {js, modules, inputs, og, ...} JSON shape
// framejs.app's `POST /j/<uuid>.json` expects and forwarded server-side (no CORS
// from the browser). Returns the stable framejs.app page URL to navigate to.
app.post("/api/frame", async (c) => {
  try {
    const { hashParams, id } = (await c.req.json()) as {
      hashParams?: string;
      id?: string;
    };

    if (!hashParams) {
      return c.json({ error: "Missing required field: hashParams" }, 400);
    }

    const frameJson = decodeHashParamsToJson(hashParams);
    if (!frameJson.js) {
      return c.json({ error: "Nothing to save: missing js" }, 400);
    }

    // The uuid slug is canonically dashless (matches framejs.app's /j/:uuid
    // route spec) — resolveSaveUuid normalizes once so every use below,
    // including the URL handed back to the browser, stays in that form.
    const uuid = resolveSaveUuid(id);

    const response = await fetch(
      `${FRAMEJS_APP_ORIGIN}/j/${uuid}.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(frameJson),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Save frame failed:", response.status, detail);
      return c.json(
        { error: "Failed to save frame", status: response.status },
        response.status === 403 ? 403 : 502,
      );
    }
    await response.body?.cancel();

    track(c, { name: "save-frame", source: detectSource(c) });

    return c.json({
      id: uuid,
      url: `${FRAMEJS_APP_ORIGIN}/j/${uuid}`,
    });
  } catch (error) {
    console.error("Save frame error:", error);
    return c.json({ error: "Failed to save frame" }, 500);
  }
});

// Builds the hash-param string a /j/:uuid page should resolve to. Fetches
// `${FRAMEJS_APP_ORIGIN}/<uuid>`, expecting a 200 JSON object of hash-param values
// (e.g. {js, modules, inputs, og}), and encodes it to a hash-param string.
// Returns null when the backend has no frame for that uuid (non-200 response).
async function fetchUuidHashParams(uuid: string): Promise<string | null> {
  console.log(
    "uuid fetch url",
    `${FRAMEJS_APP_ORIGIN}/j/${normalizeUuid(uuid)}.json`,
  );
  const response = await fetch(
    `${FRAMEJS_APP_ORIGIN}/j/${normalizeUuid(uuid)}.json`,
  );
  console.log("response", response.status);
  if (response.status !== 200) {
    // Drain the body so the connection can be reused.
    await response.body?.cancel();
    return null;
  }
  const json = await response.json();
  return jsonToHashParams(json as Record<string, unknown>);
}

// Shortened URL — fetches hash params and serves index.html with injected init
// script. Accepts either a sha256 (S3-backed blob) or a uuid (resolved via
// FRAMEJS_APP_ORIGIN).
app.get("/j/:sha256", async (c) => {
  const id = c.req.param("sha256");

  // uuid.json form: proxy the raw frame JSON to the framejs.app backend (or the
  // dev-stack equivalent via FRAMEJS_APP_ORIGIN) so callers can fetch a frame's
  // {js, modules, inputs, og} JSON same-origin, without hitting framejs.app CORS.
  if (id && id.endsWith(".json")) {
    const uuid = normalizeUuid(id.slice(0, -".json".length));
    if (!UUID_REGEX.test(uuid)) {
      return c.json({ error: "Invalid frame id" }, 400);
    }
    try {
      const upstream = `${FRAMEJS_APP_ORIGIN}/j/${uuid}.json`;
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

      const hashParams = await fetchUuidHashParams(id);
      if (hashParams === null) {
        return c.json({ error: "Shortened URL not found" }, 404);
      }

      const decoded = decodeHashParamsToJson(hashParams);
      const ogMetaTags = buildOgMetaTags(decoded);
      const canonicalKeysJson = JSON.stringify(CANONICAL_HASH_PARAM_KEYS);

      // Strip edit=true so the app doesn't immediately exit short-URL mode on load.
      const s = hashParams.startsWith("?") ? hashParams.slice(1) : hashParams;
      const cleanedParams = s
        .split("&")
        .filter((p) => p.split("=")[0] !== "edit");
      const cleanedHashParams = cleanedParams.length
        ? "?" + cleanedParams.join("&")
        : "";

      // Set the same __SHORT_URL_* globals as the sha256 handler so:
      //  - module scripts await __SHORT_URL_READY before reading window.location.hash
      //  - the cleanup code removes canonical params from the URL after the code runs
      //  - useShortUrlMode keeps the /j/:uuid path until the user edits
      // The IIFE computes merged params and installs a Location.prototype.hash
      // shadow so module scripts can read the full params without the URL bar
      // ever showing the expanded hash. Falls back to history.replaceState on
      // browsers where Location.prototype.hash is not configurable.
      const injectedScript =
        `<script id="short-url-init">window.__SHORT_URL_ID=${
          JSON.stringify(id)
        };window.__FRAMEJS_APP_ORIGIN=${
          JSON.stringify(FRAMEJS_APP_ORIGIN)
        };window.__SHORT_URL_CANONICAL_KEYS=new Set(${canonicalKeysJson});window.__SHORT_URL_HASH_PARAMS=${
          JSON.stringify(cleanedHashParams)
        };window.__SHORT_URL_READY=Promise.resolve();(function(){var stored=window.__SHORT_URL_HASH_PARAMS;var C=window.__SHORT_URL_CANONICAL_KEYS;var ss=stored.charAt(0)==="?"?stored.slice(1):stored;var sp=ss.split("&");var pm={},po=[];for(var i=0;i<sp.length;i++){var ei=sp[i].indexOf("=");var ki=ei===-1?sp[i]:sp[i].substring(0,ei);if(ki){pm[ki]=sp[i];po.push(ki);}}var h=window.location.hash;if(h){var s=h.charAt(0)==="#"?h.slice(1):h;if(s.charAt(0)==="?")s=s.slice(1);if(s){var up=s.split("&");for(var j=0;j<up.length;j++){var ej=up[j].indexOf("=");var kj=ej===-1?up[j]:up[j].substring(0,ej);if(kj&&!C.has(kj)){if(!(kj in pm))po.push(kj);pm[kj]=up[j];}}}}var m="?";for(var x=0;x<po.length;x++){if(x>0)m+="&";m+=pm[po[x]];}(function(od){try{if(od&&od.configurable){window.__sfhod=od;window.__sfhs=m;Object.defineProperty(Location.prototype,'hash',{get:function(){return window.__sfhs!==undefined?'#'+window.__sfhs:od.get.call(this)},set:function(v){od.set.call(this,v)},configurable:true})}else{history.replaceState(null,'',window.location.pathname+window.location.search+'#'+m)}}catch(e){history.replaceState(null,'',window.location.pathname+window.location.search+'#'+m)}})(Object.getOwnPropertyDescriptor(Location.prototype,'hash'));})();</script>`;

      return await serveShortUrlHtml(ogMetaTags, injectedScript);
    } catch (error) {
      console.error("UUID shortened URL error:", error);
      return c.json({ error: "Failed to retrieve shortened URL" }, 500);
    }
  }

  // sha256 form: resolve via S3.
  if (!s3Client) {
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

    const key = `j/${sha256}`;

    // Fetch from S3
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    if (!response.Body) throw new Error("S3 response body is empty");
    const hashParams = await response.Body.transformToString();

    const canonicalKeysJson = JSON.stringify(CANONICAL_HASH_PARAM_KEYS);

    // Extract OG metadata from hash params and inject meta tags
    const decoded = decodeHashParamsToJson(hashParams);
    const ogMetaTags = buildOgMetaTags(decoded);

    // Inject a lightweight script that sets the short URL ID and starts an
    // async fetch for the hash params.  The full hash-param blob is NOT
    // embedded in the HTML — crawlers only see OG meta tags without paying
    // for the large JS/definition payload.  The module scripts in index.html
    // await __SHORT_URL_READY before reading hash params.
    const injectedScript =
      `<script id="short-url-init">window.__SHORT_URL_ID = ${
        JSON.stringify(
          sha256,
        )
      };window.__FRAMEJS_APP_ORIGIN = ${
        JSON.stringify(FRAMEJS_APP_ORIGIN)
      };window.__SHORT_URL_CANONICAL_KEYS = new Set(${canonicalKeysJson});window.__SHORT_URL_READY = fetch("/api/j/" + ${
        JSON.stringify(
          sha256,
        )
      } + "/url").then(function(r){return r.text()}).then(function(fullUrl){var idx=fullUrl.indexOf("#");var stored=idx===-1?"":fullUrl.slice(idx+1);window.__SHORT_URL_HASH_PARAMS=stored;var C=window.__SHORT_URL_CANONICAL_KEYS;var ss=stored.charAt(0)==="?"?stored.slice(1):stored;var sp=ss.split("&");var pm={};var po=[];for(var i=0;i<sp.length;i++){var ei=sp[i].indexOf("=");var ki=ei===-1?sp[i]:sp[i].substring(0,ei);if(ki){pm[ki]=sp[i];po.push(ki)}}var h=window.location.hash;if(h){var s=h.charAt(0)==="#"?h.slice(1):h;if(s.charAt(0)==="?")s=s.slice(1);if(s){var up=s.split("&");for(var j=0;j<up.length;j++){var ej=up[j].indexOf("=");var kj=ej===-1?up[j]:up[j].substring(0,ej);if(kj&&!C.has(kj)){if(!(kj in pm))po.push(kj);pm[kj]=up[j]}}}}var m="?";for(var x=0;x<po.length;x++){if(x>0)m+="&";m+=pm[po[x]]};(function(od){try{if(od&&od.configurable){window.__sfhod=od;window.__sfhs=m;Object.defineProperty(Location.prototype,'hash',{get:function(){return window.__sfhs!==undefined?'#'+window.__sfhs:od.get.call(this)},set:function(v){od.set.call(this,v)},configurable:true})}else{history.replaceState(null,'',window.location.pathname+window.location.search+'#'+m)}}catch(e){history.replaceState(null,'',window.location.pathname+window.location.search+'#'+m)}})(Object.getOwnPropertyDescriptor(Location.prototype,'hash'))});</script>`;

    return await serveShortUrlHtml(ogMetaTags, injectedScript);
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

// Short URL metaframe.json — computes effective definition from stored hash params
app.get("/j/:sha256/metaframe.json", async (c) => {
  try {
    const id = c.req.param("sha256");

    if (id && UUID_REGEX.test(id)) {
      const hashParams = await fetchUuidHashParams(id);
      if (hashParams === null) {
        return c.json({ error: "Shortened URL not found" }, 404);
      }
      return c.json(computeMetaframeDefinition(hashParams));
    }

    if (!s3Client) {
      return c.json({ error: "URL shortening not configured" }, 503);
    }

    if (!id || !/^[a-f0-9]{64}$/.test(id)) {
      return c.json({ error: "Invalid shortened URL ID" }, 400);
    }

    const key = `j/${id}`;
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
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
      const hashParams = await fetchUuidHashParams(id);
      if (hashParams === null) {
        return c.json({ error: "Shortened URL not found" }, 404);
      }
      track(c, { name: "fetch", source: detectSource(c) });
      return c.json({ id, hashParams: decodeHashParamsToJson(hashParams) });
    }

    if (!s3Client) {
      return c.json({ error: "URL shortening not configured" }, 503);
    }

    if (!id || !/^[a-f0-9]{64}$/.test(id)) {
      return c.json({ error: "Invalid shortened URL ID" }, 400);
    }

    const key = `j/${id}`;
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
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

// Short URL full-URL API — returns the full URL as plain text for a given sha256
app.get("/api/j/:sha256/url", async (c) => {
  try {
    const id = c.req.param("sha256");

    if (id && UUID_REGEX.test(id)) {
      const hashParams = await fetchUuidHashParams(id);
      if (hashParams === null) {
        return c.json({ error: "Shortened URL not found" }, 404);
      }
      const protocol = c.req.header("x-forwarded-proto") || "https";
      const host = c.req.header("host");
      c.header("Content-Type", "text/plain; charset=utf-8");
      return c.text(`${protocol}://${host}/#${hashParams}`);
    }

    if (!s3Client) {
      return c.json({ error: "URL shortening not configured" }, 503);
    }

    if (!id || !/^[a-f0-9]{64}$/.test(id)) {
      return c.json({ error: "Invalid shortened URL ID" }, 400);
    }

    const key = `j/${id}`;
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
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

// File download endpoint — redirects to the public S3 URL
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

// Shortened URL — fetches hash params from S3 and serves index.html with injected init script
app.get("/command-js.md", async (c) => {
  const content = await Deno.readTextFile("./static/command-js.md");
  c.header("Content-Type", "text/plain; charset=utf-8");
  return c.text(content);
});

// Static file serving
app.use("/editor/*", serveStatic({ root: "./" }));
// /docs (no trailing slash) → /docs/ so VitePress index.html is served
app.get("/docs", (c) => c.redirect("/docs/", 301));
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
