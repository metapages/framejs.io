// Shared helpers for working with frames and their framejs.io hash-param URLs.
// A frame's editable content lives in appended `frame_version` rows; the newest
// version's `url` holds the framejs.io hash params that fully describe the app.

import type {
  GetFrameDetailQuery,
  GetFramesQuery,
} from "@/lib/graphql/generated/sdk.ts";

export const FRAMEJS_BASE_URL = "https://framejs.io";

// The `og` column is jsonb (typed `any` by codegen): an Open Graph blob used for
// dashboard/bookmark display. `image` is shown when present.
export interface OpenGraph {
  title?: string;
  description?: string;
  image?: string;
}

export type FrameListItem = GetFramesQuery["frame"][number];
export type FrameVersion = NonNullable<
  GetFrameDetailQuery["frame_by_pk"]
>["frame_versions"][number];

// Presentation/transient hash params that should not count as content changes
// (and so should never trigger a save or be persisted as part of a version).
const TRANSIENT_KEYS = new Set(["hm", "edit", "css"]);

/** Pull the latest version's url + og off a list/detail frame row. */
export function latestVersion(
  frame: { frame_versions: { url?: string | null; og?: unknown }[] },
): { url?: string; og: OpenGraph } {
  const v = frame.frame_versions[0];
  return {
    url: v?.url ?? undefined,
    og: (v?.og ?? {}) as OpenGraph,
  };
}

/** Extract the hash-param body (without leading `#`/`#?`) from a stored value. */
function hashParamsOf(stored: string): string {
  const hashIndex = stored.indexOf("#");
  if (hashIndex >= 0) {
    const hash = stored.slice(hashIndex + 1);
    return hash.startsWith("?") ? hash.slice(1) : hash;
  }
  // A full URL with no hash carries no params; anything else is raw params.
  if (/^https?:\/\//.test(stored)) return "";
  return stored.startsWith("?") ? stored.slice(1) : stored;
}

/**
 * Canonical framejs.io URL for a stored version url: drops transient params
 * (hm/edit/css) and sorts the rest so equal content always serializes equally.
 * Used both for display and for change-detection between versions.
 */
export function normalizeFrameUrl(
  stored: string | null | undefined,
  base = FRAMEJS_BASE_URL,
): string {
  const segments = hashParamsOf(stored ?? "")
    .split("&")
    .filter(Boolean)
    .filter((seg) => !TRANSIENT_KEYS.has(seg.split("=")[0]));
  segments.sort();
  return `${base}/#?${segments.join("&")}`;
}

/** The URL to embed for editing: canonical content + an always-visible menu. */
export function embedFrameUrl(
  stored: string | null | undefined,
  base = FRAMEJS_BASE_URL,
): string {
  const normalized = normalizeFrameUrl(stored, base);
  const sep = normalized.endsWith("#?") ? "" : "&";
  return `${normalized}${sep}hm=visible`;
}

/**
 * Split a stored framejs.io url into its raw `[key, value]` hash-param pairs.
 *
 * Deliberately does NOT use `URLSearchParams`: framejs values are base64 (which
 * can contain `+`), and `URLSearchParams` would turn each `+` into a space and
 * corrupt the value. This mirrors @metapages/hash-query's own splitter, which
 * keeps values verbatim.
 */
function hashParamPairs(stored: string | undefined): [string, string][] {
  return hashParamsOf(stored ?? "")
    .split("&")
    .filter(Boolean)
    .map((seg) => {
      const eq = seg.indexOf("=");
      return eq === -1
        ? [seg, ""] as [string, string]
        : [seg.slice(0, eq), seg.slice(eq + 1)] as [string, string];
    });
}

/**
 * Decode one stored hash-param value into the form a consumer would use.
 *
 * framejs.io encodes its structured params with @metapages/hash-query as
 * `base64(encodeURIComponent(payload))`. JSON blobs (`og`, `inputs`, `modules`)
 * decode to objects/arrays; a string payload (`js`) decodes to its raw string.
 *
 * The first `atob` of a genuinely-encoded value is always printable ASCII (it
 * is the output of `encodeURIComponent`), so a non-ASCII result means the value
 * was never hash-query-encoded — e.g. a transient scalar like `hm=visible` that
 * merely happens to be valid base64 — and is returned as a plain (URI-decoded)
 * value instead.
 */
export function unpackHashParamValue(raw: string): unknown {
  let bytes: string | undefined;
  try {
    bytes = atob(raw);
  } catch {
    bytes = undefined;
  }
  if (bytes !== undefined && /^[\x20-\x7e]*$/.test(bytes)) {
    let text: string;
    try {
      text = decodeURIComponent(bytes);
    } catch {
      text = bytes;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Expand a stored framejs.io url into a `{ key: unpackedValue }` dict so the
 * hash params can be consumed directly (powers the `/j/<uuid>.json` API).
 */
export function unpackFrameUrl(
  url: string | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of hashParamPairs(url)) {
    out[key] = unpackHashParamValue(value);
  }
  return out;
}

/**
 * Best-effort extraction of the Open Graph blob from a framejs.io hash url.
 * `og` is a hash-query base64 JSON blob, so decode it via `unpackHashParamValue`
 * (a plain `JSON.parse` would fail on the encoded value).
 */
export function ogFromFrameUrl(url: string): OpenGraph | undefined {
  for (const [key, value] of hashParamPairs(url)) {
    if (key === "og") {
      const og = unpackHashParamValue(value);
      return og && typeof og === "object" ? og as OpenGraph : undefined;
    }
  }
  return undefined;
}

/** UUID without dashes, used for the `/j/:uuid` path. */
export function frameSlug(id: string): string {
  return id.replaceAll("-", "");
}

/** Re-insert dashes into a 32-char slug to recover a queryable uuid. */
export function frameIdFromSlug(slug: string): string {
  const s = slug.replaceAll("-", "");
  if (s.length !== 32) return slug;
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${
    s.slice(16, 20)
  }-${s.slice(20)}`;
}

/** graphql-request ClientError exposes the GraphQL errors here. */
export function errMessage(e: unknown): string {
  const gqlErrors = (e as { response?: { errors?: { message: string }[] } })
    .response?.errors;
  return gqlErrors?.[0]?.message ?? (e as Error).message ?? "Request failed";
}
