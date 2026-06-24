import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getAdminSdk } from "@/lib/graphql/client.ts";
import {
  frameIdFromSlug,
  FRAMEJS_BASE_URL,
  latestVersion,
  type OpenGraph,
} from "@/lib/frame.ts";
import Layout from "@/components/Layout.tsx";
import FrameView from "@/islands/FrameView.tsx";

export default define.page(async function FramePage(ctx) {
  // The path carries the uuid without dashes; recover it for the DB query.
  const id = frameIdFromSlug(ctx.params.uuid);
  const user = ctx.state.user!; // /j/* is a protected route (see lib/auth.ts)

  // Admin SDK so we can load the frame and check ownership here on the server.
  let frame: Awaited<
    ReturnType<ReturnType<typeof getAdminSdk>["GetFrameDetail"]>
  >["frame_by_pk"] = null;
  try {
    const { frame_by_pk } = await getAdminSdk().GetFrameDetail({ id });
    frame = frame_by_pk;
  } catch {
    // DB query failed
  }

  // Owner-only management view; hide existence of others' / deleted frames.
  if (!frame || frame.deleted || frame.user !== user.id) {
    return new Response("Not found", { status: 404 }) as never;
  }

  const og = latestVersion(frame).og as OpenGraph;
  const framejsBaseUrl = Deno.env.get("FRAMEJS_IO_ORIGIN") ?? FRAMEJS_BASE_URL;

  return (
    <Layout user={user}>
      <Head>
        <title>{og.title || "Frame"} - framejs.io</title>
      </Head>
      <FrameView
        frameId={frame.id}
        initialPublic={frame.public}
        initialVersions={frame.frame_versions}
        framejsBaseUrl={framejsBaseUrl}
      />
    </Layout>
  );
});
