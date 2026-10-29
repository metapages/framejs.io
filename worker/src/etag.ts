// Content ETags, shared by the app shell and the /j/<id>.<ext> files.

/** Short, stable ETag from a SHA-256 prefix of the served body. */
export async function computeEtag(body: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body),
  );
  const hex = Array.from(new Uint8Array(digest).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `"${hex}"`;
}

/**
 * Whether an If-None-Match header names `etag`: a comma-separated list, weak
 * (`W/`) or strong, or `*` (RFC 9110 §13.1.2 uses weak comparison here).
 */
export function etagMatches(
  ifNoneMatch: string | undefined,
  etag: string,
): boolean {
  if (!ifNoneMatch) return false;
  const strip = (t: string) => t.trim().replace(/^W\//, "");
  return ifNoneMatch.split(",").some((t) =>
    t.trim() === "*" || strip(t) === strip(etag)
  );
}
