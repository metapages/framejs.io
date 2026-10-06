// A frame's `js` has TWO legal forms: inline source, or a single-line http(s)
// URL referencing source. framejs.app hoists a large frame's source into
// storage and stores the reference, so the editor must cope with both.
//
// Keep `isJsSourceUrl` in step with the runtime's copy in worker/index.html —
// the two must agree on what counts as a reference or the editor and the
// running frame disagree about what the code is.

/** True when a decoded `js` value REFERENCES the source rather than being it. */
export const isJsSourceUrl = (value: string | undefined): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  return /^https?:\/\/\S+$/.test(trimmed) && !/\s/.test(trimmed);
};

/**
 * The reserved metaframe input the runtime hands the editor the frame's SOURCE
 * on, bypassing the url entirely.
 *
 * It exists because a url is not a transport for a payload with no size bound:
 * the source is base64(encodeURIComponent(...)) — about 2.4x — so a 1.65 MB
 * frame became a 3.9 MB iframe `src`, which Chrome drops past 2 MiB (landing
 * the pane on `about:blank#blocked`, empty, no console error) and Firefox's url
 * parser throws on past 1 MiB. postMessage has no such limit.
 *
 * Keep this name in step with worker/index.html's `setInputs` call. It is
 * prefixed so it cannot collide with one of the frame's own input names, and
 * `withoutReservedInputs` strips it before inputs reach the UI or a shared url.
 */
export const RESERVED_SOURCE_INPUT = "__framejs_source";

/**
 * The metaframe OUTPUT the editor sends an edit back on — the return leg of the
 * same channel, and for the same reason. The runtime listens for it and is the
 * one that writes `js` into the page url (which is what framejs.app persists).
 *
 * Keep in step with the output listener in worker/index.html.
 */
export const RESERVED_SOURCE_OUTPUT = "__framejs_source";

/**
 * The frame's own inputs, with the runtime's reserved keys removed.
 *
 * The reserved source arrives in the same input map as the frame's inputs
 * (metapage has no separate parent→child payload channel), so anything that
 * treats that map as the frame's inputs has to filter it — otherwise the whole
 * source would be folded into a shared url as if the user had set it as an
 * input.
 */
export const withoutReservedInputs = <T extends Record<string, unknown>>(
  inputs: T | undefined,
): T | undefined => {
  if (!inputs || !(RESERVED_SOURCE_INPUT in inputs)) return inputs;
  const { [RESERVED_SOURCE_INPUT]: _dropped, ...rest } = inputs;
  return rest as T;
};

/** Sources already fetched this page load, keyed by url. Immutable content. */
const sourceCache = new Map<string, string>();

/**
 * The source behind a `js` reference. Returns undefined when it cannot be read
 * — the caller keeps whatever it had rather than replacing code with an error
 * string, which would be saved as the frame's source on the next write.
 */
export const fetchFrameSource = async (
  url: string,
): Promise<string | undefined> => {
  const key = url.trim();
  const cached = sourceCache.get(key);
  if (cached !== undefined) return cached;
  try {
    const response = await fetch(key);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    const source = await response.text();
    sourceCache.set(key, source);
    return source;
  } catch (error) {
    console.error(`Could not fetch frame source from ${key}`, error);
    return undefined;
  }
};
