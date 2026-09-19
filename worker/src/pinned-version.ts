// Helpers for the published/pinned version feature: `/j/<uuid>?v=<sha256>`.
//
// A PUBLISHED frame version (retention > 0, minted by framejs.app's
// "Publish version" action) is permanently public and immutable — it keeps
// resolving even if the Frame is later made private or deleted (like a public
// commit or gist). framejs.io renders it by proxying the pinned JSON from
// framejs.app — with no banner or other chrome of its own: the runtime shows
// the frame and nothing else. The "published version" label lives on the
// framejs.app frame page, which is where the edit button hands off to.
//
// These are the pure pieces of that feature — the query suffix, the branding
// split, and the injected client scripts — pulled out of server.ts so they can
// be unit-tested without a live backend or a running server.

/**
 * The version pin carried on a frame URL's query string. framejs.io
 * standardizes on `?v=`, but framejs.app also accepts the legacy `?sha256=`
 * alias, so read both here (an explicit `v` wins). Returns undefined when the
 * request carries no pin (render the current version).
 */
export function pinnedVersionFromQuery(
  query: (key: string) => string | undefined,
): string | undefined {
  return query("v") || query("sha256") || undefined;
}

/**
 * The upstream query suffix that forwards a pin to framejs.app
 * (`/j/<uuid>.json?v=<sha256>`) and to the pinned favicon endpoint. Empty when
 * unpinned so the current version is served.
 */
export function pinnedVersionSuffix(version?: string): string {
  return version ? `?v=${encodeURIComponent(version)}` : "";
}

/**
 * The hash params the RUNTIME should be handed for a `/j/<uuid>` render.
 *
 * Two rewrites, both about chrome rather than content:
 *  - `edit` is dropped, so a stored `edit=true` can't drag the page out of
 *    short-URL mode the moment it loads;
 *  - a pinned (published) version gets `readonly=true`, because that version is
 *    immutable: the runtime then opens its code pane read-only, labels its own
 *    button "View", and never writes the pane's contents back. Any inbound
 *    `readonly` is dropped first — this decides it, not the stored frame.
 *
 * Takes and returns the leading-`?` form (`"?js=..."`), empty when nothing is
 * left.
 */
export function runtimeHashParams(
  hashParams: string,
  version?: string,
): string {
  const raw = hashParams.startsWith("?") ? hashParams.slice(1) : hashParams;
  const params = raw
    .split("&")
    .filter((pair) => {
      if (!pair) return false;
      const key = pair.split("=")[0];
      return key !== "edit" && key !== "readonly";
    });
  if (version) params.push("readonly=true");
  return params.length ? "?" + params.join("&") : "";
}

/**
 * framejs.app returns a reserved `branding` field (the free-tier "Made with
 * framejs" overlay HTML) only on a LIVE version. It is NOT frame content, so
 * pull it out of the decoded JSON (mutating `json`) before the remainder is
 * encoded to hash params. Returns undefined when absent — a Pro owner, or any
 * pinned version, which never carries it.
 */
export function extractBranding(
  json: Record<string, unknown>,
): string | undefined {
  const branding = typeof json.branding === "string"
    ? json.branding
    : undefined;
  delete json.branding;
  return branding;
}

/**
 * Client script injecting framejs.app's `branding` overlay HTML immediately
 * after `#root` (bottom-right). The markup is self-contained and comes from our
 * own paired origin, so it is safe to inject as innerHTML.
 */
export function brandingScript(branding: string): string {
  return `<script id="framejs-branding">(function(){var h=${
    JSON.stringify(branding)
  };function b(){var r=document.getElementById('root');var d=document.createElement('div');d.innerHTML=h;var n=d.firstElementChild;if(!n)return;if(r&&r.parentNode){r.parentNode.insertBefore(n,r.nextSibling);}else{document.body.appendChild(n);}}if(document.body)b();else document.addEventListener('DOMContentLoaded',b);})();</script>`;
}
