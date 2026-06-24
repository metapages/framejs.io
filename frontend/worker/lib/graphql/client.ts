import { GraphQLClient } from "graphql-request";
import { getSdk } from "./generated/sdk.ts";
import { getGraphqlUrl } from "@/lib/nhost.ts";

const adminSecret = Deno.env.get("NHOST_ADMIN_SECRET") ?? "";

/**
 * Typed SDK bound to a user's access token. All requests run through Hasura
 * with the `user` role, so row-level permissions apply.
 */
export function getUserSdk(accessToken: string) {
  const client = new GraphQLClient(getGraphqlUrl(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return getSdk(client);
}

/** Typed SDK bound to the admin secret (bypasses Hasura permissions). */
export function getAdminSdk() {
  const client = new GraphQLClient(getGraphqlUrl(), {
    headers: { "x-hasura-admin-secret": adminSecret },
  });
  return getSdk(client);
}
