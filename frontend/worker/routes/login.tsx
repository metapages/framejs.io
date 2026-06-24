import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import Layout from "@/components/Layout.tsx";
import AuthForm from "@/islands/AuthForm.tsx";

export default define.page(function LoginPage(ctx) {
  const redirect = new URL(ctx.req.url).searchParams.get("redirect") ??
    undefined;

  if (ctx.state.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: redirect ?? "/dashboard" },
    }) as never;
  }

  return (
    <Layout user={null}>
      <Head>
        <title>Log in - framejs.io</title>
      </Head>
      <div class="py-12 px-4">
        <h1 class="text-2xl font-bold text-center mb-8">
          Log in to framejs.io
        </h1>
        <AuthForm mode="login" redirectTo={redirect} />
      </div>
    </Layout>
  );
});
