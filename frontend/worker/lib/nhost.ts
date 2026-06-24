const subdomain = Deno.env.get("NHOST_SUBDOMAIN") ?? "local";
const region = Deno.env.get("NHOST_REGION") ?? "";
const adminSecret = Deno.env.get("NHOST_ADMIN_SECRET") ?? "";

export function getGraphqlUrl(): string {
  if (region) {
    return `https://${subdomain}.hasura.${region}.nhost.run/v1/graphql`;
  }
  return `https://${subdomain}.hasura.nhost.run/v1/graphql`;
}

export async function graphqlAdmin<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(getGraphqlUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": adminSecret,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data as T;
}

export async function graphqlUser<T = unknown>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(getGraphqlUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data as T;
}
