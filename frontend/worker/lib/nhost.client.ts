import { createClient, type NhostClient } from "@nhost/nhost-js";
import { CookieStorage } from "@nhost/nhost-js/session";

let _nhost: NhostClient | undefined;

/**
 * Browser-only nhost client. Created lazily so it never instantiates during
 * SSR (CookieStorage touches document.cookie). Call it from event handlers /
 * effects, never at module top level of an island.
 *
 * The full session is persisted in a cookie (`nhostSession`, not httpOnly) so
 * the Fresh SSR middleware can read it too — see lib/auth.ts.
 */
export function getNhost(): NhostClient {
  if (!_nhost) {
    _nhost = createClient({
      subdomain: import.meta.env.VITE_NHOST_SUBDOMAIN || "local",
      region: import.meta.env.VITE_NHOST_REGION || "local",
      storage: new CookieStorage({
        secure: import.meta.env.PROD,
        sameSite: "lax",
      }),
    });
  }
  return _nhost;
}
