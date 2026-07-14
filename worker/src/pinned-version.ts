// Helpers for the published/pinned version feature: `/j/<uuid>?v=<sha256>`.
//
// A PUBLISHED frame version (retention > 0, minted by framejs.app's
// "Publish version" action) is permanently public and immutable — it keeps
// resolving even if the Frame is later made private or deleted (like a public
// commit or gist). framejs.io renders it by proxying the pinned JSON from
// framejs.app and overlaying a small read-only banner.
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
 * Client script injecting a fixed, top-of-page read-only banner that marks a
 * published version (showing the first 8 chars of the sha256) with a link back
 * to the current (latest) version at `/j/<uuid>`. The uuid is dashless as
 * served on the path.
 */
export function pinnedBannerScript(uuid: string, version: string): string {
  return `<script id="pinned-banner">(function(){function b(){var d=document.createElement('div');d.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;align-items:center;gap:12px;justify-content:center;padding:6px 12px;font:500 13px system-ui,-apple-system,sans-serif;background:rgba(20,20,40,.85);color:#fff;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)';d.innerHTML='<span>\\uD83D\\uDCCC Published version <code style=\\'opacity:.7;font-size:11px\\'>'+${
    JSON.stringify(version.slice(0, 8))
  }+'</code> \\u2014 read-only</span>';var a=document.createElement('a');a.href=${
    JSON.stringify(`/j/${uuid}`)
  };a.textContent='View latest version \\u2192';a.style.cssText='color:#a5b4fc;text-decoration:underline;white-space:nowrap';d.appendChild(a);document.body.appendChild(d);}if(document.body)b();else document.addEventListener('DOMContentLoaded',b);})();</script>`;
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
