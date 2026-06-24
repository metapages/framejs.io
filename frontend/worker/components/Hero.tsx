export default function Hero() {
  return (
    <section class="py-20 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-5xl font-bold tracking-tight mb-6">
          Create websites with <span class="text-indigo-600">JavaScript</span>
        </h1>
        <p class="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          A browser-based editor for building and sharing interactive web
          projects. Write code, see it live, share with a link.
        </p>
        <div class="flex items-center justify-center gap-4">
          <a
            href="/signup"
            class="bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700"
          >
            Get Started Free
          </a>
          <a
            href="/pricing"
            class="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg text-lg font-medium hover:bg-gray-50"
          >
            View Pricing
          </a>
        </div>
      </div>
    </section>
  );
}
