import { GraphQLClient } from "graphql-request";
import { getSdk } from "./generated/sdk.ts";
import { getNhost } from "@/lib/nhost.client.ts";

let _sdk: ReturnType<typeof getSdk> | undefined;

/**
 * Typed GraphQL SDK that talks DIRECTLY to Hasura from the browser. The user's
 * JWT (managed and refreshed by the nhost client) is attached per request, so
 * Hasura's row-level permissions scope every query and mutation — no REST
 * gateway in between. Lazily created so it never runs during SSR.
 */
export function getBrowserSdk() {
  if (!_sdk) {
    const nhost = getNhost();
    const client = new GraphQLClient(nhost.graphql.url, {
      requestMiddleware: async (req) => {
        // Refresh if the access token is within 60s of expiring, then attach it.
        let session = nhost.getUserSession();
        if (session) {
          session = (await nhost.refreshSession(60).catch(() => session)) ??
            session;
        }
        const headers = new Headers(req.headers as HeadersInit);
        if (session?.accessToken) {
          headers.set("authorization", `Bearer ${session.accessToken}`);
        }
        return { ...req, headers };
      },
    });
    _sdk = getSdk(client);
  }
  return _sdk;
}
