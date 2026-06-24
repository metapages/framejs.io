import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getAdminSdk } from "@/lib/graphql/client.ts";
import type { GetProjectByKeyQuery } from "@/lib/graphql/generated/sdk.ts";
import Layout from "@/components/Layout.tsx";
import Editor from "@/islands/Editor.tsx";

type ProjectData = GetProjectByKeyQuery["projects"][number];

export default define.page(async function ProjectPage(ctx) {
  const key = ctx.params.key;

  // Admin SDK so private projects can be fetched and ownership checked here.
  let project: ProjectData | null = null;
  try {
    const { projects } = await getAdminSdk().GetProjectByKey({ key });
    project = projects[0] ?? null;
  } catch {
    // DB query failed
  }

  if (!project) {
    return new Response("Project not found", { status: 404 }) as never;
  }

  // Check access: public projects are visible to all, private only to owner
  if (!project.isPublic && ctx.state.user?.id !== project.userId) {
    return new Response("Not found", { status: 404 }) as never;
  }

  const isOwner = ctx.state.user?.id === project.userId;
  const editorBaseUrl = Deno.env.get("EDITOR_BASE_URL") ??
    "https://editor.framejs.io";

  return (
    <Layout user={ctx.state.user}>
      <Head>
        <title>{project.title} - framejs.io</title>
      </Head>
      <Editor
        projectId={project.id}
        projectKey={project.key}
        title={project.title}
        hashParams={project.hashParams ?? null}
        storageFileId={project.storageFileId ?? null}
        editorBaseUrl={editorBaseUrl}
        isOwner={isOwner}
        nhostSubdomain={Deno.env.get("NHOST_SUBDOMAIN") ?? "local"}
        nhostRegion={Deno.env.get("NHOST_REGION") ?? ""}
      />
    </Layout>
  );
});
