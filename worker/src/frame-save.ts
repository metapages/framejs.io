// POST /api/frame: request-body parsing and the forward to framejs.app. Kept
// separate from server.ts (which calls Deno.serve as a side effect on import)
// so it can be tested against a stub framejs.app.

import { normalizeUuid, resolveSaveUuid, UUID_REGEX } from "./frame-uuid.ts";
import { stripDefaultHashParams } from "./metaframe-definition.ts";

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
 * result must carry a non-empty string `js`. A present `id` must be a uuid: a
 * caller that mangled the id it was handed would otherwise silently mint a new
 * frame on every re-export.
 *
 * `frame` keys are NOT filtered to the allowed hash params: they are stored as
 * sent (minus default-valued params), so a frame author experimenting with
 * state keys doesn't lose them on the way in.
 */
export function parseSaveFrameBody(
  body: SaveFrameBody | null | undefined,
  decodeHashParams: (hashParams: string) => Record<string, unknown>,
): SaveFrameRequest {
  if (!body || typeof body !== "object") {
    return { error: "Body must be a JSON object" };
  }

  let id: string | undefined;
  if (body.id !== undefined && body.id !== null && body.id !== "") {
    if (typeof body.id !== "string" || !UUID_REGEX.test(body.id)) {
      return {
        error:
          "`id` must be the uuid returned by a previous save (omit it to create a new frame)",
      };
    }
    id = body.id;
  }

  let frameJson: Record<string, unknown>;
  if (body.frame !== undefined) {
    if (
      !body.frame || typeof body.frame !== "object" || Array.isArray(body.frame)
    ) {
      return { error: "`frame` must be an object like {js, inputs, og}" };
    }
    frameJson = stripDefaultHashParams(body.frame as Record<string, unknown>);
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

export type SaveFrameResult = {
  status: 200 | 400 | 403 | 502;
  body: { id: string; url: string } | { error: string; status?: number };
};

/**
 * Parses the body and writes the frame to `POST <appOrigin>/j/<uuid>.json`:
 * updating `id` in place when given, otherwise minting a new uuid. Returns the
 * HTTP status and JSON body for the route to send. framejs.app's 403 (frame
 * claimed / not yours) passes through; any other upstream failure is a 502.
 * Network errors throw, for the route's catch-all 500.
 */
export async function saveFrame(
  body: unknown,
  opts: {
    appOrigin: string;
    decodeHashParams: (hashParams: string) => Record<string, unknown>;
    fetch?: typeof fetch;
  },
): Promise<SaveFrameResult> {
  const parsed = parseSaveFrameBody(
    body as SaveFrameBody | null,
    opts.decodeHashParams,
  );
  if ("error" in parsed) {
    return { status: 400, body: { error: parsed.error } };
  }

  // The uuid slug is canonically dashless (matches framejs.app's /j/:uuid
  // route spec) — resolveSaveUuid normalizes once so every use below,
  // including the URL handed back to the caller, stays in that form.
  const uuid = parsed.id ? normalizeUuid(parsed.id) : resolveSaveUuid();

  const response = await (opts.fetch ?? fetch)(
    `${opts.appOrigin}/j/${uuid}.json`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.frameJson),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Save frame failed:", response.status, detail);
    return {
      status: response.status === 403 ? 403 : 502,
      body: { error: "Failed to save frame", status: response.status },
    };
  }
  await response.body?.cancel();

  return {
    status: 200,
    body: { id: uuid, url: `${opts.appOrigin}/j/${uuid}` },
  };
}
