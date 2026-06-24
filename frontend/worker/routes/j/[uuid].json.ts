import { define } from "@/utils.ts";
import { getAdminSdk } from "@/lib/graphql/client.ts";
import { frameIdFromSlug, latestVersion, unpackFrameUrl } from "@/lib/frame.ts";

// Public read-only API: GET /j/<uuid>.json returns the most recent frame
// version's hash params, decoded into a `{ key: value }` dict consumers can use
// directly. Served only for a public, non-deleted frame — no auth (this route is
// exempt from the /j/ auth middleware, see lib/auth.ts).
export const handler = define.handlers({
  async GET(ctx) {
    // The path carries the uuid without dashes; recover it for the DB query.
    const id = frameIdFromSlug(ctx.params.uuid);

    let frame: Awaited<
      ReturnType<ReturnType<typeof getAdminSdk>["GetFrameDetail"]>
    >["frame_by_pk"] = null;
    try {
      const { frame_by_pk } = await getAdminSdk().GetFrameDetail({ id });
      frame = frame_by_pk;
    } catch {
      // DB/query failure — treated as not found below.
    }

    // Hide everything that isn't a live public frame (don't leak existence,
    // private content, or soft-deleted frames).
    if (!frame || frame.public !== true || frame.deleted) {
      return Response.json({ error: "not found" }, { status: 404 });
    }

    const { url } = latestVersion(frame);
    return Response.json(unpackFrameUrl(url));
  },
});
