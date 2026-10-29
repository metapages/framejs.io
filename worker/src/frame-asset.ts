// A short-URL frame's hash params, one at a time, as plain files (issue #134):
//
//   /j/<id>.js              the `js` param: the frame's code, unaltered
//   /j/<id>.esm.js          the code reduced to an importable module of its
//                           functions (extractModule, module-export.ts)
//   /j/<id>.css             the `css` param
//   /j/<id>.<param>.json    any hash param's value as JSON (inputs, modules, og,
//                           options, definition, a frame's own setJson keys…)
//
// `<id>` is a sha256 or a (dashed or dashless) uuid; a uuid takes the same
// `?v=<sha256>` pin as its page. `/j/<uuid>.json` (the whole frame) is a
// separate, older route in server.ts and is not handled here.
//
// This is the HTTP side — path grammar, id validation, the service-worker
// refusal, URL-referenced values and caching — kept free of S3 and Hono so it
// can be tested end to end with stub dependencies.

import { computeEtag, etagMatches } from "./etag.ts";
import { normalizeUuid, UUID_REGEX } from "./frame-uuid.ts";
import { extractModule, ModuleExportError } from "./module-export.ts";
import { pinnedVersionSuffix } from "./pinned-version.ts";
import { ExportError } from "./standalone-export.ts";

/** What a `/j/<id>.<ext>` path asks for. */
export type FrameAsset =
  | { kind: "js" }
  | { kind: "esm" }
  | { kind: "css" }
  | { kind: "param"; param: string };

/**
 * Splits the `/j/:id` path segment into the frame id and the asset it names,
 * or null when it names none of them (a bare id, or `<id>.json`, which the
 * caller routes elsewhere).
 */
export function parseFrameAssetPath(
  segment: string,
): { id: string; asset: FrameAsset } | null {
  const dot = segment.indexOf(".");
  if (dot <= 0) return null;
  const id = segment.slice(0, dot);
  const ext = segment.slice(dot + 1);
  if (ext === "js") return { id, asset: { kind: "js" } };
  if (ext === "esm.js") return { id, asset: { kind: "esm" } };
  if (ext === "css") return { id, asset: { kind: "css" } };
  const param = /^([A-Za-z0-9_-]+)\.json$/.exec(ext)?.[1];
  if (param) return { id, asset: { kind: "param", param } };
  return null;
}

export interface FrameAssetRequest {
  /** The path id: a sha256 or a (dashed) uuid. */
  id: string;
  asset: FrameAsset;
  /** The `?v=` / `?sha256=` pin, if any. Ignored for a sha256 id. */
  pinnedVersion?: string;
  header: (name: string) => string | undefined;
}

export interface FrameAssetDeps {
  publicOrigin: string;
  /** Whether sha256 frames can be read at all. */
  s3Configured: boolean;
  /**
   * A frame's decoded hash params, and whether the RECORD can ever change (a
   * sha256 or a pinned version can't; a live uuid can). null: no such frame.
   */
  loadFrameParams: (
    id: string,
    pinnedVersion?: string,
  ) => Promise<{ params: Record<string, unknown>; immutable: boolean } | null>;
  /** Fetches the text behind a `js=<url>` / `css=<url>` value. */
  fetchText: (url: string) => Promise<string>;
  /**
   * Whether the bytes behind such a URL can never change. Only then may a
   * response built from them be cached as immutable.
   */
  isImmutableSourceUrl: (url: string) => boolean;
}

// Same test as the runtime's isJsSourceUrl / isCssStylesheetUrl
// (worker/index.html): a one-line http(s) URL is a REFERENCE to the content.
const isUrlReference = (value: string) => /^https?:\/\/\S+$/.test(value.trim());

const IMMUTABLE = "public, max-age=31536000, immutable";
const JAVASCRIPT = "text/javascript; charset=utf-8";

const json = (body: unknown, status: number, extra: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });

const paramOf = (asset: FrameAsset) =>
  asset.kind === "param" ? asset.param : asset.kind === "css" ? "css" : "js";

const extensionOf = (asset: FrameAsset) =>
  asset.kind === "param"
    ? `${asset.param}.json`
    : asset.kind === "esm"
    ? "esm.js"
    : asset.kind;

export async function frameAssetResponse(
  req: FrameAssetRequest,
  deps: FrameAssetDeps,
): Promise<Response> {
  // Every response varies on this header, so no shared cache (the Deno Deploy
  // edge, a CDN, a proxy) can store a 200 and replay it to a service-worker
  // registration that the check below would have refused.
  const vary = { Vary: "Service-Worker" };

  // User code at a stable same-origin path could be registered as a service
  // worker scoped to /j/ — over every other frame's page. `/j/<id>.js` is the
  // frame's code verbatim, top level and all. An import or a fetch never
  // sends this header; a service-worker registration always does.
  if (req.header("service-worker")) {
    return json({ error: "Not available as a service worker" }, 403, vary);
  }

  const id = normalizeUuid(req.id);
  const isUuid = UUID_REGEX.test(id);
  if (!isUuid && !/^[a-f0-9]{64}$/.test(id)) {
    return json({ error: "Invalid shortened URL ID" }, 400, vary);
  }
  if (!isUuid && !deps.s3Configured) {
    return json({ error: "URL shortening not configured" }, 503, vary);
  }
  // A sha256 is already one exact version: a pin on it means nothing.
  const pinnedVersion = isUuid ? req.pinnedVersion : undefined;
  const { asset } = req;
  const param = paramOf(asset);

  let value: unknown;
  let immutable: boolean;
  try {
    const frame = await deps.loadFrameParams(id, pinnedVersion);
    if (frame === null) {
      return json({ error: "Shortened URL not found" }, 404, vary);
    }
    value = frame.params[param];
    immutable = frame.immutable;
    if (asset.kind !== "param") {
      if (typeof value !== "string" || !value.trim()) {
        return json({ error: `This frame has no \`${param}\`` }, 404, vary);
      }
      // `js=<url>` (a hoisted frame) or `css=<url>` (a stylesheet link): the
      // content is behind the URL, and only as immutable as what it serves.
      if (isUrlReference(value)) {
        const url = value.trim();
        immutable &&= deps.isImmutableSourceUrl(url);
        value = await deps.fetchText(url);
      }
    } else if (value === undefined) {
      return json({ error: `This frame has no \`${param}\`` }, 404, vary);
    }
  } catch (error) {
    if (error instanceof ExportError) {
      return json({ error: error.message }, error.status, vary);
    }
    console.error("Frame asset error:", error);
    return json({ error: "Failed to retrieve frame" }, 502, vary);
  }

  let body: string;
  let contentType: string;
  switch (asset.kind) {
    case "js":
      body = value as string;
      contentType = JAVASCRIPT;
      break;
    case "css":
      body = value as string;
      contentType = "text/css; charset=utf-8";
      break;
    case "param":
      body = JSON.stringify(value);
      contentType = "application/json; charset=utf-8";
      break;
    case "esm":
      try {
        const { code, skipped } = extractModule(value as string);
        const canonical = `${deps.publicOrigin}/j/${id}.${extensionOf(asset)}${
          pinnedVersionSuffix(pinnedVersion)
        }`;
        body = `// ${canonical}\n` +
          `// The functions of this frame's code: top-level code is removed.\n` +
          (skipped.length
            ? `// Not exported (not functions or const primitives): ${
              skipped.join(", ")
            }\n`
            : "") +
          `\n${code}`;
      } catch (error) {
        if (error instanceof ModuleExportError) {
          return json({ error: error.message }, 422, vary);
        }
        throw error;
      }
      contentType = JAVASCRIPT;
      break;
  }

  const headers: Record<string, string> = {
    ...vary,
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  };
  if (immutable) {
    headers["Cache-Control"] = IMMUTABLE;
    return new Response(body, { headers });
  }
  // Mutable: revalidate every request, but answer 304 when unchanged.
  headers["ETag"] = await computeEtag(body);
  headers["Cache-Control"] = "no-cache";
  if (etagMatches(req.header("if-none-match"), headers["ETag"])) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(body, { headers });
}
