import { useSignal } from "@preact/signals";
import type { User } from "@/utils.ts";
import { getNhost } from "@/lib/nhost.client.ts";

async function logout() {
  const nhost = getNhost();
  const refreshToken = nhost.getUserSession()?.refreshToken;
  try {
    if (refreshToken) await nhost.auth.signOut({ refreshToken });
  } catch {
    // ignore network errors; clear the local session regardless
  }
  nhost.clearSession();
  globalThis.location.href = "/";
}

interface UserMenuProps {
  user: User;
}

export default function UserMenu({ user }: UserMenuProps) {
  const open = useSignal(false);

  return (
    <div class="relative">
      <button
        type="button"
        onClick={() => (open.value = !open.value)}
        class="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
      >
        {user.avatarUrl
          ? (
            <img
              src={user.avatarUrl}
              alt=""
              class="w-8 h-8 rounded-full"
            />
          )
          : (
            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium">
              {(user.displayName ?? user.email)[0].toUpperCase()}
            </div>
          )}
        <span>{user.displayName ?? user.email}</span>
      </button>
      {open.value && (
        <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <a
            href="/dashboard"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Dashboard
          </a>
          <button
            type="button"
            onClick={logout}
            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
