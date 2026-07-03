// UUID helpers for framejs.app frames. Kept separate from server.ts (which
// calls Deno.serve as a side effect on import) so this pure logic can be
// unit tested directly.

import { uuidv7 } from "uuidv7";

export { uuidv7 };

/** Matches a canonical UUID (8-4-4-4-12 hex, e.g. from gen_random_uuid()). */
export const UUID_REGEX =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** framejs.app's /j/:uuid route is canonically dashless — strip any dashes. */
export const normalizeUuid = (id: string): string => id.replaceAll("-", "");

/**
 * Resolves the canonical (dashless) uuid to use when saving a frame: reuses
 * an existing valid id (accepted dashed or dashless) if provided, otherwise
 * mints a fresh one. Always normalized to framejs.app's dashless /j/:uuid
 * spec, so every caller — the POST to framejs.app and the URL handed back to
 * the browser — shares one canonical value instead of drifting apart.
 */
export function resolveSaveUuid(id?: string): string {
  return normalizeUuid(id && UUID_REGEX.test(id) ? id : uuidv7());
}
