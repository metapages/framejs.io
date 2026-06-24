import type { User } from "@/utils.ts";
import type { StoredSession } from "@nhost/nhost-js/session";

/**
 * SSR auth: the browser nhost client persists the full session as a cookie
 * (`nhostSession`, see lib/nhost.client.ts), so the server reads the same
 * cookie to know the current user. This keeps route-protection working without
 * a round-trip to the auth service.
 */
export function getUserFromRequest(
  req: Request,
): { user: User; accessToken: string } | null {
  // The request can carry MORE THAN ONE `nhostSession` cookie (e.g. a stale or
  // sibling-app duplicate scoped to a parent domain/different path). The browser
  // sends them all and ordering isn't guaranteed, so we try every candidate and
  // use the first that parses to a real session — otherwise a malformed leading
  // duplicate would shadow the good one and silently bounce the user to /login.
  for (
    const raw of parseCookieValues(
      req.headers.get("cookie") ?? "",
      "nhostSession",
    )
  ) {
    let session: StoredSession;
    try {
      session = JSON.parse(raw) as StoredSession;
    } catch {
      continue;
    }

    const u = session.user;
    if (!u || !session.accessToken) continue;

    return {
      user: {
        id: u.id,
        email: u.email ?? "",
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
      },
      accessToken: session.accessToken,
    };
  }
  return null;
}

/** All values for a cookie name (a request may carry duplicates). */
function parseCookieValues(cookies: string, name: string): string[] {
  const re = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`, "g");
  const values: string[] = [];
  for (const match of cookies.matchAll(re)) {
    try {
      values.push(decodeURIComponent(match[1]));
    } catch {
      values.push(match[1]);
    }
  }
  return values;
}

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/j/"];

export function isProtectedRoute(pathname: string): boolean {
  // /j/<uuid>.json is a public read-only API gated only by frame.public, so it
  // must bypass the /j/ auth gate that guards the HTML management views.
  if (pathname.startsWith("/j/") && pathname.endsWith(".json")) return false;
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}
