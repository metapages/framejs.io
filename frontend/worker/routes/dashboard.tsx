import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import Layout from "@/components/Layout.tsx";
import Dashboard from "@/islands/Dashboard.tsx";

export default define.page(function DashboardPage(ctx) {
  const user = ctx.state.user!;
  const framejsOrigin = Deno.env.get("FRAMEJS_IO_ORIGIN") ?? "https://framejs.io";

  return (
    <Layout user={user}>
      <Head>
        <title>Dashboard - framejs.io</title>
      </Head>
      <div class="max-w-6xl mx-auto py-8 px-4">
        <Dashboard userId={user.id} framejsOrigin={framejsOrigin} />
      </div>
    </Layout>
  );
});
