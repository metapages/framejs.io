/**
 * Browser-only utility for resolving /j/:slug URLs to their framejs.io
 * content URLs (hash-param form). Only import from islands.
 *
 * Two slug forms are recognised regardless of which host the URL came from:
 *   - 64 hex chars  → sha256 short URL (content-addressed on framejs.io)
 *   - 32 hex chars  → UUID frame slug (looked up via GraphQL)
 */
import { getBrowserSdk } from "@/lib/graphql/client.browser.ts";
import { frameIdFromSlug } from "@/lib/frame.ts";

/**
 * Returns the hex slug if `url` has the form `<any-origin>/j/<hex-or-uuid>`,
 * otherwise returns null.
 */
export function extractFrameJsSlug(url: string): string | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^\/j\/([0-9a-f-]+)$/i);
    if (!m) return null;
    return m[1].replaceAll("-", "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Attempt to resolve a /j/:slug URL to its raw framejs.io content URL.
 * Returns the original `url` unchanged if the slug is unrecognised or the
 * lookup fails (caller should treat that as an error for /j/ URLs).
 *
 * NOTE: callers should apply `normalizeFrameUrl(resolved, framejsOrigin)`
 * to remap the result to the correct origin.
 */
export async function resolveFrameUrl(url: string): Promise<string> {
  const slug = extractFrameJsSlug(url);
  if (!slug) return url;

  try {
    if (slug.length === 64) {
      // sha256 short URL — resolved via framejs.io's content-addressed API
      const res = await fetch(`https://framejs.io/api/j/${slug}/url`);
      if (res.ok) {
        const resolved = (await res.text()).trim();
        if (resolved.startsWith("https://")) return resolved;
      }
    } else if (slug.length === 32) {
      // UUID frame slug — fetch the stored content URL via GraphQL
      const { frame_by_pk } = await getBrowserSdk().GetFrameById({
        id: frameIdFromSlug(slug),
      });
      const storedUrl = frame_by_pk?.frame_versions[0]?.url;
      if (storedUrl) return storedUrl;
    }
  } catch { /* fall through */ }

  return url;
}
