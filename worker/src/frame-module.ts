// The `/j/<id>.js` route (issue #134): a frame's functions as an importable ES
// module. What survives of the code is extractModule's business
// (module-export.ts); this is the HTTP side — id validation, the
// service-worker refusal, hoisted sources and caching — kept free of S3 and
// Hono so it can be tested end to end with stub dependencies.

import { computeEtag, etagMatches } from "./etag.ts";
import { normalizeUuid, UUID_REGEX } from "./frame-uuid.ts";
import { extractModule, ModuleExportError } from "./module-export.ts";
import { pinnedVersionSuffix } from "./pinned-version.ts";
import { ExportError } from "./standalone-export.ts";

export interface FrameModuleRequest {
  /** The path id, `.js` already removed: a sha256 or a (dashed) uuid. */
  id: string;
  /** The `?v=` / `?sha256=` pin, if any. Ignored for a sha256 id. */
  pinnedVersion?: string;
  header: (name: string) => string | undefined;
}

export interface FrameModuleDeps {
  publicOrigin: string;
  /** Whether sha256 frames can be read at all. */
  s3Configured: boolean;
  /**
   * A frame's `js` param, and whether the RECORD can ever change (a sha256 or
   * a pinned version can't; a live uuid can). null when there is no frame.
   */
  loadFrameJs: (
    id: string,
    pinnedVersion?: string,
  ) => Promise<{ js: string; immutable: boolean } | null>;
  /** Fetches a hoisted `js=<url>` source. Throws ExportError for the user. */
  fetchSource: (url: string) => Promise<string>;
  /**
   * Whether the bytes behind a hoisted source URL can never change. Only then
   * may a module built from it be cached as immutable.
   */
  isImmutableSourceUrl: (url: string) => boolean;
}

// Same test as the runtime's isJsSourceUrl (worker/index.html).
const isSourceUrl = (js: string) => /^https?:\/\/\S+$/.test(js.trim());

const IMMUTABLE = "public, max-age=31536000, immutable";

const json = (body: unknown, status: number, extra: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });

export async function frameModuleResponse(
  req: FrameModuleRequest,
  deps: FrameModuleDeps,
): Promise<Response> {
  // Every response varies on this header, so no shared cache (the Deno Deploy
  // edge, a CDN, a proxy) can store a 200 and replay it to a service-worker
  // registration that the check below would have refused.
  const vary = { Vary: "Service-Worker" };

  // User code at a stable same-origin path could be registered as a service
  // worker scoped to /j/ — over every other frame's page. A module import never
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

  let source: string;
  let immutable: boolean;
  try {
    const frame = await deps.loadFrameJs(id, pinnedVersion);
    if (frame === null) {
      return json({ error: "Shortened URL not found" }, 404, vary);
    }
    if (!frame.js.trim()) {
      return json({ error: "This frame has no code" }, 404, vary);
    }
    source = frame.js;
    immutable = frame.immutable;
    // A hoisted frame stores `js=<url>` of its source. The module is then only
    // as immutable as what that URL serves.
    if (isSourceUrl(source)) {
      const url = source.trim();
      immutable &&= deps.isImmutableSourceUrl(url);
      source = await deps.fetchSource(url);
    }
  } catch (error) {
    if (error instanceof ExportError) {
      return json({ error: error.message }, error.status, vary);
    }
    console.error("Frame module error:", error);
    return json({ error: "Failed to retrieve frame" }, 502, vary);
  }

  let body: string;
  try {
    const { code, skipped } = extractModule(source);
    const canonical = `${deps.publicOrigin}/j/${id}.js${
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

  const headers: Record<string, string> = {
    ...vary,
    "Content-Type": "text/javascript; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  };
  if (immutable) {
    headers["Cache-Control"] = IMMUTABLE;
    return new Response(body, { headers });
  }
  // Mutable: revalidate every import, but answer 304 when unchanged.
  headers["ETag"] = await computeEtag(body);
  headers["Cache-Control"] = "no-cache";
  if (etagMatches(req.header("if-none-match"), headers["ETag"])) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(body, { headers });
}
