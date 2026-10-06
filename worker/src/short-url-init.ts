// The bootstrap <script> injected into a short-URL page (/j/:uuid, /j/:sha256).
//
// Its whole job is to tell the runtime module in index.html which frame it is
// and where to get the frame's hash params. See worker/index.html
// (`inShortUrlMode`, `currentHashString`) and
// docs/development/runtime-load-state-machine.md §1.

import { pinnedVersionSuffix } from "./pinned-version.ts";

/**
 * JSON for embedding inside an inline `<script>`.
 *
 * `JSON.stringify` alone is NOT enough: it escapes quotes but leaves `<` and
 * `/` alone, so a value containing `</script>` closes the element early and
 * everything after it is parsed as markup. Escaping the angle brackets to
 * their `<` / `>` forms keeps the value inert; both are ordinary JS
 * string escapes, so the value the runtime parses is unchanged.
 *
 * Both current callers validate the id upstream (UUID_REGEX, or 64 hex chars),
 * so this is defence in depth rather than a live hole — but the escaping
 * belongs with the serialization, not with the callers remembering to guard.
 */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value ?? null)
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E");
}

/** Where `shortUrlInitScript`'s fetch points. Exported for the route + tests. */
export function runtimeParamsPath(
  id: string,
  pinnedVersion?: string,
): string {
  return `/api/j/${encodeURIComponent(id)}/runtime-params${
    pinnedVersionSuffix(pinnedVersion)
  }`;
}

/**
 * Where a uuid page's og metadata comes from, on framejs.app.
 *
 * This string is a CROSS-REPO CONTRACT: framejs.app serves it from
 * `routes/j/[uuid]/og.json.ts` (logic in `lib/frameOg.ts`). A page request
 * reads og from here instead of the full params endpoint, so rendering never
 * resolves the frame's content — see `fetchUuidOg` in server.ts. The pin must
 * be forwarded or a published page would show the LIVE version's tags.
 */
export function frameOgPath(uuid: string, pinnedVersion?: string): string {
  return `/j/${uuid}/og.json${pinnedVersionSuffix(pinnedVersion)}`;
}

/**
 * The `<script id="short-url-init">` both short-URL page handlers inject.
 *
 * The params are FETCHED, never inlined into the HTML. Inlining them meant a
 * large frame shipped its whole payload inside a `Cache-Control: no-cache`
 * document — re-downloaded on every load and on every crawler/unfurl of the
 * link — and `/j/:uuid` did exactly that until this was unified with the
 * sha256 path, which had fetched from the start for precisely this reason.
 *
 * The latency cost is near zero: this is a classic script, so it runs during
 * parse and its fetch overlaps the two cross-origin jsdelivr module imports
 * (hash-query, metapage) that the deferred runtime module already blocks on. A
 * same-origin fetch lands well inside that window.
 *
 * `__SHORT_URL_READY` MUST NOT REJECT. index.html awaits it unguarded at the
 * top of the runtime module, so a rejection aborts the whole module and the
 * page renders nothing at all — strictly worse than a frame that fails to
 * load. On failure we resolve with "" instead: the frame does not render
 * (there are no params), but the page keeps its chrome and the menu button can
 * still hand off to framejs.app via `__SHORT_URL_ID`.
 *
 * Every other global stays inlined — they are a few bytes each, and the edit
 * hand-off (`onMenuClick`) reads them synchronously.
 */
export function shortUrlInitScript(
  id: string,
  appOrigin: string,
  pinnedVersion?: string,
): string {
  // Every interpolated value goes through jsonForScript — these land inside a
  // <script>, and an id is not something to concatenate in raw.
  return `<script id="short-url-init">window.__SHORT_URL_ID=${
    jsonForScript(id)
  };window.__FRAMEJS_APP_ORIGIN=${
    jsonForScript(appOrigin)
  };window.__SHORT_URL_VERSION=${
    jsonForScript(pinnedVersion ?? null)
  };window.__SHORT_URL_READY=fetch(${
    jsonForScript(runtimeParamsPath(id, pinnedVersion))
  }).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.text()})` +
    `.then(function(p){window.__SHORT_URL_HASH_PARAMS=p})` +
    `.catch(function(e){console.error("Failed to load frame params",e);window.__SHORT_URL_HASH_PARAMS=""});</script>`;
}
