import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import Layout from "@/components/Layout.tsx";
import Hero from "@/components/Hero.tsx";

export default define.page(function HomePage(ctx) {
  return (
    <Layout user={ctx.state.user}>
      <Head>
        <title>framejs.io - Create websites with JavaScript</title>
      </Head>
      <Hero />

      {/* Features */}
      <section class="py-16 px-4 bg-white">
        <div class="max-w-5xl mx-auto">
          <h2 class="text-3xl font-bold text-center mb-12">
            Everything you need
          </h2>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                &lt;/&gt;
              </div>
              <h3 class="font-semibold mb-2">Browser Editor</h3>
              <p class="text-sm text-gray-600">
                Write HTML, CSS, and JavaScript directly in your browser with
                instant preview.
              </p>
            </div>
            <div class="text-center">
              <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                &uarr;
              </div>
              <h3 class="font-semibold mb-2">Instant Sharing</h3>
              <p class="text-sm text-gray-600">
                Every project gets a unique URL. Share your work with anyone,
                instantly.
              </p>
            </div>
            <div class="text-center">
              <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                &#9733;
              </div>
              <h3 class="font-semibold mb-2">Project Management</h3>
              <p class="text-sm text-gray-600">
                Organize your projects, control visibility, and manage
                everything from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section class="py-16 px-4">
        <div class="max-w-2xl mx-auto text-center">
          <h2 class="text-2xl font-bold mb-4">Ready to start building?</h2>
          <p class="text-gray-600 mb-8">
            Create your free account and start building web projects today.
          </p>
          <a
            href="/signup"
            class="bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700"
          >
            Sign Up Free
          </a>
        </div>
      </section>
    </Layout>
  );
});
