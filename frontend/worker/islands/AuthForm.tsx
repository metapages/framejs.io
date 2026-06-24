import { useSignal } from "@preact/signals";
import { getNhost } from "@/lib/nhost.client.ts";

interface AuthFormProps {
  mode: "login" | "signup";
  redirectTo?: string;
}

/**
 * The SSR auth gate reads the non-httpOnly `nhostSession` cookie (see
 * lib/auth.ts). The browser silently drops that cookie if it exceeds the ~4KB
 * limit or collides with a conflicting one, leaving the in-memory session
 * looking fine while the server sees no auth. Confirm it actually landed.
 */
function hasSessionCookie(): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith("nhostSession="));
}

export default function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const email = useSignal("");
  const password = useSignal("");
  const error = useSignal("");
  const loading = useSignal(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error.value = "";
    loading.value = true;

    try {
      const nhost = getNhost();
      const body = { email: email.value, password: password.value };

      // Clear any pre-existing (possibly stale or conflicting) session first so
      // a leftover `nhostSession` cookie can't survive and shadow the new one.
      nhost.clearSession();

      // The session middleware persists the returned session to the cookie,
      // so a successful call leaves us authenticated.
      const res = mode === "login"
        ? await nhost.auth.signInEmailPassword(body)
        : await nhost.auth.signUpEmailPassword(body);

      if (!nhost.getUserSession()) {
        // No in-memory session (e.g. email verification required for this
        // project).
        error.value = res.body && "session" in res.body && !res.body.session
          ? "Check your email to verify your account."
          : "Could not start a session.";
      } else if (!hasSessionCookie()) {
        // In-memory session exists but the cookie the SSR middleware relies on
        // was never persisted (browser dropped it: ~4KB size limit, or a
        // conflicting cookie on a shared host). Redirecting now would bounce
        // straight back to /login with no explanation, so surface it instead.
        error.value =
          "Logged in, but the session could not be saved. Clear this site's " +
          "cookies and try again.";
      } else {
        globalThis.location.href = redirectTo ?? "/dashboard";
      }
    } catch (e) {
      // nhost FetchError carries the hasura-auth error body.
      const body = (e as { body?: { message?: string; error?: string } }).body;
      error.value = body?.message ?? body?.error ?? (e as Error).message ??
        "Network error. Please try again.";
    } finally {
      loading.value = false;
    }
  }

  function handleOAuth(provider: "github" | "google") {
    globalThis.location.href = getNhost().auth.signInProviderURL(provider, {
      redirectTo: globalThis.location.origin + "/auth/callback",
    });
  }

  return (
    <div class="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email.value}
            onInput={(e) => email.value = (e.target as HTMLInputElement).value}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label
            for="password"
            class="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={9}
            value={password.value}
            onInput={(e) =>
              password.value = (e.target as HTMLInputElement).value}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {error.value && <p class="text-sm text-red-600">{error.value}</p>}
        <button
          type="submit"
          disabled={loading.value}
          class="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading.value ? "..." : (mode === "login" ? "Log in" : "Sign up")}
        </button>
      </form>

      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuth("github")}
            class="py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            GitHub
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            class="py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Google
          </button>
        </div>
      </div>

      <p class="mt-6 text-center text-sm text-gray-600">
        {mode === "login"
          ? (
            <>
              Don't have an account?{" "}
              <a href="/signup" class="text-indigo-600 hover:text-indigo-500">
                Sign up
              </a>
            </>
          )
          : (
            <>
              Already have an account?{" "}
              <a href="/login" class="text-indigo-600 hover:text-indigo-500">
                Log in
              </a>
            </>
          )}
      </p>
    </div>
  );
}
