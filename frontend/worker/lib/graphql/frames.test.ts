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

// Frames (and their versions) RESTRICT-reference the user, so they must be
// hard-deleted before the user can be removed. Order matters: versions →
// frames → user.
async function deleteUser(userId: string): Promise<void> {
  await graphqlAdmin(
    `mutation($id: uuid!) {
      delete_frame_version(where: { frames: { user: { _eq: $id } } }) {
        affected_rows
      }
      delete_frame(where: { user: { _eq: $id } }) { affected_rows }
      deleteUsers(where: { id: { _eq: $id } }) { affected_rows }
    }`,
    { id: userId },
  );
}

Deno.test("authenticated client can create, edit, and soft-delete a frame", async () => {
  const email = `frame-check-${crypto.randomUUID()}@example.com`;
  const { accessToken, userId } = await signUp(email, "password123");
  const sdk = getUserSdk(accessToken);

  try {
    // CREATE — a frame plus its first version (url hash params + og blob).
    const created = await sdk.InsertFrame({
      object: {
        public: true,
        frame_versions: {
          data: [{
            url: "https://framejs.io/#?js=...",
            og: { title: "My Frame", description: "A test frame" },
          }],
        },
      },
    });
    const frame = created.insert_frame_one;
    assert(frame, "insert_frame_one should be returned");
    const version = frame.frame_versions[0];
    assertEquals(version.og.title, "My Frame");
    assertEquals(version.url, "https://framejs.io/#?js=...");

    // READ — the new frame is visible to its owner with its latest version.
    const list = await sdk.GetFrames();
    const listed = list.frame.find((f) => f.id === frame.id);
    assert(listed, "created frame should appear in the owner's frame list");
    assertEquals(listed.frame_versions[0].og.description, "A test frame");

    // EDIT — append a new version; the latest now reflects the edit.
    await sdk.InsertFrameVersion({
      object: {
        frame: frame.id,
        url: "https://framejs.io/#?js=edited",
        og: { title: "My Frame (edited)", description: "Edited" },
      },
    });
    const afterEdit = await sdk.GetFrameById({ id: frame.id });
    assertEquals(
      afterEdit.frame_by_pk?.frame_versions[0].og.title,
      "My Frame (edited)",
    );

    // DELETE — soft: the frame is flagged, not removed.
    const deleted = await sdk.DeleteFrame({ id: frame.id });
    assertEquals(deleted.update_frame_by_pk?.deleted, true);

    // CONFIRM — soft-deleted frames drop out of the dashboard list.
    const after = await sdk.GetFrames();
    assert(
      !after.frame.some((f) => f.id === frame.id),
      "soft-deleted frame should no longer be listed",
    );
  } finally {
    await deleteUser(userId);
  }
});
