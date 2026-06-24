import { assert, assertEquals } from "jsr:@std/assert@^1";
import { getUserSdk } from "./client.ts";
import { graphqlAdmin } from "@/lib/nhost.ts";

function getAuthUrl(): string {
  const sub = Deno.env.get("NHOST_SUBDOMAIN") ?? "local";
  const region = Deno.env.get("NHOST_REGION") ?? "";
  return region
    ? `https://${sub}.auth.${region}.nhost.run/v1`
    : `https://${sub}.auth.nhost.run/v1`;
}

async function signUp(
  email: string,
  password: string,
): Promise<{ accessToken: string; userId: string }> {
  const res = await fetch(`${getAuthUrl()}/signup/email-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.session) {
    throw new Error(`signup returned no session: ${JSON.stringify(data)}`);
  }
  return {
    accessToken: data.session.accessToken,
    userId: data.session.user.id,
  };
}

async function deleteUser(userId: string): Promise<void> {
  await graphqlAdmin(
    `mutation($id: uuid!) {
      deleteUsers(where: { id: { _eq: $id } }) { affected_rows }
    }`,
    { id: userId },
  );
}

Deno.test("authenticated client can create and delete a project", async () => {
  const email = `codegen-check-${crypto.randomUUID()}@example.com`;
  const { accessToken, userId } = await signUp(email, "password123");

  // The SDK is bound to the user's JWT, so every call runs as the `user`
  // role and is subject to Hasura row-level permissions.
  const sdk = getUserSdk(accessToken);

  try {
    // CREATE
    const created = await sdk.InsertProject({
      object: {
        key: `check-${crypto.randomUUID().slice(0, 8)}`,
        title: "Codegen Check",
      },
    });
    const project = created.insert_projects_one;
    assert(project, "insert_projects_one should be returned");
    assertEquals(project.title, "Codegen Check");
    assertEquals(project.isPublic, true, "is_public defaults to true");

    // READ — the new row is visible to its owner
    const list = await sdk.GetProjects();
    assert(
      list.projects.some((p) => p.id === project.id),
      "created project should appear in the owner's project list",
    );

    // DELETE
    const deleted = await sdk.DeleteProject({ id: project.id });
    assertEquals(deleted.delete_projects_by_pk?.id, project.id);

    // CONFIRM gone
    const after = await sdk.GetProjects();
    assert(
      !after.projects.some((p) => p.id === project.id),
      "deleted project should no longer be listed",
    );
  } finally {
    await deleteUser(userId);
  }
});
