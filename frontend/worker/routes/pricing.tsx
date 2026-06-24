import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import Layout from "@/components/Layout.tsx";
import PricingCard from "@/islands/PricingCard.tsx";

export default define.page(function PricingPage(ctx) {
  return (
    <Layout user={ctx.state.user}>
      <Head>
        <title>Pricing - framejs.io</title>
      </Head>
      <div class="max-w-4xl mx-auto py-16 px-4">
        <h1 class="text-3xl font-bold text-center mb-4">
          Simple, transparent pricing
        </h1>
        <p class="text-center text-gray-600 mb-12">
          Start for free, upgrade when you need more.
        </p>
        <div class="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div class="bg-white border border-gray-200 rounded-xl p-8">
            <h2 class="text-xl font-bold mb-2">Free</h2>
            <p class="text-3xl font-bold mb-4">
              $0<span class="text-base font-normal text-gray-500">/month</span>
            </p>
            <ul class="space-y-3 text-sm text-gray-600 mb-8">
              <li>3 projects</li>
              <li>Public projects only</li>
              <li>Community support</li>
            </ul>
            {ctx.state.user
              ? (
                <a
                  href="/dashboard"
                  class="block text-center py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Go to Dashboard
                </a>
              )
              : (
                <a
                  href="/signup"
                  class="block text-center py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Get Started
                </a>
              )}
          </div>
          <div class="bg-white border-2 border-indigo-600 rounded-xl p-8 relative">
            <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
              Popular
            </span>
            <h2 class="text-xl font-bold mb-2">Pro</h2>
            <p class="text-3xl font-bold mb-4">
              $9<span class="text-base font-normal text-gray-500">/month</span>
            </p>
            <ul class="space-y-3 text-sm text-gray-600 mb-8">
              <li>Unlimited projects</li>
              <li>Private projects</li>
              <li>Priority support</li>
              <li>Custom domains</li>
            </ul>
            <PricingCard isLoggedIn={!!ctx.state.user} />
          </div>
        </div>
      </div>
    </Layout>
  );
});
