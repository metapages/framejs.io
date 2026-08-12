/**
 * Open Graph metadata: the `og` hash param and the <meta> tags rendered from it
 * into the HTML served for a frame.
 */

/** The shape stored in the `og` hash param. Every field is optional. */
export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  /** Rendered as one <meta property="article:tag"> per entry. */
  tags?: string[];
}

/** Escape a string for safe use inside an HTML attribute (double-quoted). */
export function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Normalizes the `og.tags` value into a clean string array: trimmed, empties
 * dropped, de-duplicated (case-insensitively), order preserved. Anything that
 * isn't an array of strings yields no tags — og is user-supplied JSON, so a
 * malformed value must not reach the HTML.
 */
export function normalizeOgTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const tag = entry.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
  }
  return result;
}

/** Title used when a frame has no og.title of its own. */
const DEFAULT_OG_TITLE = "framejs.io";

/**
 * Builds the Open Graph <meta> tags for a short-URL page from the decoded
 * hash-param values (the `og` field). og:type/og:title/og:description are
 * always emitted (with defaults for the missing ones); og:image and
 * article:tag only when the frame actually has them.
 */
export function buildOgMetaTags(decoded: Record<string, unknown>): string {
  const og = decoded.og as OpenGraphData | undefined;
  const articleTags = normalizeOgTags(og?.tags);
  const meta = (property: string, content: string) =>
    `<meta property="${property}" content="${escapeHtmlAttr(content)}" />\n`;

  // `article:tag` below is a property of the OG *article* vertical, so the page
  // has to declare that type for the tags to be well-formed (a page with no
  // og:type defaults to "website", where article:* has no meaning). Declared on
  // every frame page, tagged or not, so the type of a /j/ URL never depends on
  // which optional og fields happen to be filled in. The site's own pages keep
  // og:type=website — see the OG_START block in index.html.
  let tags = meta("og:type", "article");
  // Per FIELD, not per object: a frame carrying only tags (or only an image)
  // still needs a title — dropping it left such pages unfurling with no title
  // at all, which is worse than the generic default.
  tags += meta("og:title", og?.title || DEFAULT_OG_TITLE);
  tags += meta("og:description", og?.description || "");
  if (og?.image) tags += meta("og:image", og.image);
  // Open Graph has no plural "og:tag": tag words are the article vertical's
  // `article:tag`, repeated once per tag (ogp.me/#type_article).
  for (const tag of articleTags) tags += meta("article:tag", tag);
  return tags;
}
