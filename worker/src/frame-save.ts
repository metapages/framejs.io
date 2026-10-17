// Request-body parsing for POST /api/frame. Kept separate from server.ts (which
// calls Deno.serve as a side effect on import) so it can be unit tested.

export type SaveFrameBody = {
  /** The editor's current hash-param string ("?js=...&inputs=..."). */
  hashParams?: unknown;
  /**
   * The frame as plain JSON — the `{js, inputs, modules, og, definition}` shape
   * framejs.app's `POST /j/<uuid>.json` takes. This is the form an external app
   * exporting to framejs sends: it needs no hash-param encoding, and unlike a
   * direct POST to framejs.app (which serves no CORS) this endpoint is CORS-open,
   * so a browser caller can read the resulting URL.
   */
  frame?: unknown;
  /** An existing frame uuid to update in place; omitted mints a new frame. */
  id?: unknown;
};

export type SaveFrameRequest =
  | { frameJson: Record<string, unknown>; id?: string }
  | { error: string };

/**
 * Turns a POST /api/frame body into the JSON to forward to framejs.app.
 * Exactly one of `frame` / `hashParams` is used (`frame` wins); either way the
 * result must carry a non-empty string `js`.
 */
export function parseSaveFrameBody(
  body: SaveFrameBody | null | undefined,
  decodeHashParams: (hashParams: string) => Record<string, unknown>,
): SaveFrameRequest {
  if (!body || typeof body !== "object") {
    return { error: "Body must be a JSON object" };
  }
  const id = typeof body.id === "string" ? body.id : undefined;

  let frameJson: Record<string, unknown>;
  if (body.frame !== undefined) {
    if (
      !body.frame || typeof body.frame !== "object" || Array.isArray(body.frame)
    ) {
      return { error: "`frame` must be an object like {js, inputs, og}" };
    }
    frameJson = body.frame as Record<string, unknown>;
  } else if (typeof body.hashParams === "string" && body.hashParams) {
    frameJson = decodeHashParams(body.hashParams);
  } else {
    return { error: "Missing required field: frame or hashParams" };
  }

  if (typeof frameJson.js !== "string" || !frameJson.js) {
    return { error: "Nothing to save: missing js" };
  }
  return { frameJson, id };
}
