import { useSignal } from "@preact/signals";

interface PricingCardProps {
  isLoggedIn: boolean;
}

export default function PricingCard({ isLoggedIn }: PricingCardProps) {
  const loading = useSignal(false);
  const error = useSignal("");

  async function handleSubscribe() {
    if (!isLoggedIn) {
      globalThis.location.href = "/signup";
      return;
    }

    loading.value = true;
    error.value = "";

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        globalThis.location.href = data.url;
      } else {
        error.value = data.error ?? "Failed to create checkout session";
      }
    } catch {
      error.value = "Network error. Please try again.";
    } finally {
      loading.value = false;
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading.value}
        class="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading.value ? "Loading..." : "Subscribe"}
      </button>
      {error.value && <p class="text-sm text-red-600 mt-2">{error.value}</p>}
    </div>
  );
}
