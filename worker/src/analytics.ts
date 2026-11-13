// Lightweight, privacy-preserving usage analytics.
//
// Sends events server-side to a Umami instance (cloud or self-hosted) via its
// `/api/send` endpoint. Cookieless: Umami derives a monthly-rotating visitor
// hash from IP + User-Agent, so no consent banner is required.
//
// Everything here is best-effort and fire-and-forget: tracking must NEVER add
// latency to, or throw into, the request path. If the env vars are unset, all
// functions are no-ops, so local dev and self-hosters without analytics are
// unaffected.
//
// Required env vars to enable:
//   UMAMI_HOST        e.g. https://cloud.umami.is   (no trailing slash)
//   UMAMI_WEBSITE_ID  the website UUID from the Umami dashboard

import type { Context } from "@hono/hono";

import { env } from "./runtime.ts";

const UMAMI_HOST = (env("UMAMI_HOST") || "").replace(/\/+$/, "") ||
  "https://cloud.umami.is";
const UMAMI_WEBSITE_ID = env("UMAMI_WEBSITE_ID") || "";

export const analyticsEnabled: boolean = !!(UMAMI_HOST && UMAMI_WEBSITE_ID);

if (analyticsEnabled) {
  console.log(`Analytics enabled: umami host=${UMAMI_HOST}`);
}

/**
 * Where a request originated, used as a custom `source` dimension so the
 * dashboard can segment human (editor) usage from AI-agent / skill usage.
 *
 * - "skill"     the framejs Agent Skill (Claude), identified by the
 *               X-Framejs-Client header it sets on every call.
 * - "browser"   a real browser: same-origin fetch from the web editor, or a
 *               page load — identified by Origin / Sec-Fetch-* headers.
 * - "api-other" untagged programmatic traffic (hand-rolled scripts, other
 *               agents) — no client tag and no browser fingerprint.
 */
export type Source = "skill" | "browser" | "api-other";

export function detectSource(c: Context): Source {
  const tag = c.req.header("x-framejs-client");
  if (tag) return tag.startsWith("skill") ? "skill" : "api-other";

  // Browsers always send Sec-Fetch-* (and same-origin fetch sends Origin).
  // Node/curl/python clients send neither.
  if (c.req.header("sec-fetch-site") || c.req.header("origin")) {
    return "browser";
  }

  return "api-other";
}

/**
 * If this request is loading the app inside a frame, returns the embedding
 * page's origin (e.g. "https://app.example.com"); otherwise undefined.
 *
 * Relies on headers the browser sets when fetching framed content, so it needs
 * no client-side code and stays within the server-only analytics model:
 *  - Sec-Fetch-Dest: iframe | frame  marks the request as a nested (embedded)
 *    document, vs "document" for a normal top-level navigation.
 *  - Referer  the embedding page's URL. Under the default referrer policy
 *    (strict-origin-when-cross-origin) a cross-origin embed sends only the
 *    origin, which is exactly what we want; we normalize to the origin anyway.
 *
 * Returns undefined when the load is top-level (not embedded), or when the
 * parent suppressed the Referer (e.g. referrerpolicy="no-referrer"), in which
 * case the embedding origin is simply unknowable from the server.
 */
export function detectEmbed(c: Context): string | undefined {
  const dest = c.req.header("sec-fetch-dest");
  if (dest !== "iframe" && dest !== "frame") return undefined;
  const referer = c.req.header("referer");
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

/**
 * The original client's IP: Cloudflare's CF-Connecting-IP, else the first IP
 * in an X-Forwarded-For chain.
 */
function clientIp(c: Context): string {
  const xff = c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "";
  return xff.split(",")[0].trim();
}

/**
 * Record one analytics event. `name` omitted => a pageview (feeds Umami's
 * standard visitors / countries / trends); `name` set => a custom event
 * (e.g. "shorten", "fetch") that can be counted and broken down by `source`.
 *
 * Fire-and-forget: not awaited by callers, and swallows all errors. On Workers
 * the send is handed to `waitUntil`, which is what lets it finish after the
 * response is sent; Deno (no ExecutionContext) just lets it run.
 */
export function track(
  c: Context,
  opts: { name?: string; source?: Source; embedOrigin?: string } = {},
): void {
  if (!analyticsEnabled) return;
  try {
    const ip = clientIp(c);
    // Umami rejects /api/send requests without a valid User-Agent; forward the
    // client's, falling back to a worker identifier for header-less callers.
    const ua = c.req.header("user-agent") || "framejs-worker/1.0";

    const payload: Record<string, unknown> = {
      website: UMAMI_WEBSITE_ID,
      hostname: c.req.header("host") || "framejs.io",
      url: new URL(c.req.url).pathname,
      referrer: c.req.header("referer") || "",
      language: (c.req.header("accept-language") || "").split(",")[0] || "",
    };
    if (ip) payload.ip = ip; // honored by self-hosted Umami
    if (opts.name) payload.name = opts.name;
    const data: Record<string, unknown> = {};
    if (opts.source) data.source = opts.source;
    if (opts.embedOrigin) data.origin = opts.embedOrigin;
    if (Object.keys(data).length) payload.data = data;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": ua,
    };
    // Umami Cloud derives geo from X-Forwarded-For; pass the real client IP.
    if (ip) headers["X-Forwarded-For"] = ip;

    const sent = fetch(`${UMAMI_HOST}/api/send`, {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "event", payload }),
      keepalive: true,
      signal: AbortSignal.timeout(2500),
    }).then((res) => res.body?.cancel()).catch((err) =>
      console.error("analytics send failed:", err?.message || err)
    );
    try {
      c.executionCtx.waitUntil(sent);
    } catch {
      // No ExecutionContext (Deno): the promise runs on regardless.
    }
  } catch (err) {
    console.error("analytics error:", err);
  }
}
