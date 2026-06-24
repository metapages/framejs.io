import type { ComponentChildren } from "preact";
import type { User } from "@/utils.ts";
import UserMenu from "../islands/UserMenu.tsx";

interface LayoutProps {
  user: User | null;
  children: ComponentChildren;
}

export default function Layout({ user, children }: LayoutProps) {
  return (
    <div class="h-screen overflow-hidden flex flex-col">
      <nav class="bg-white border-b border-gray-200 px-4 py-3">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" class="text-xl font-bold text-indigo-600">framejs.io</a>
          <div class="flex items-center gap-4">
            {user
              ? (
                <>
                  <a
                    href="/dashboard"
                    class="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </a>
                  <UserMenu user={user} />
                </>
              )
              : (
                <>
                  <a
                    href="/login"
                    class="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Log in
                  </a>
                  <a
                    href="/signup"
                    class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Sign up
                  </a>
                </>
              )}
          </div>
        </div>
      </nav>
      <main class="flex-1 min-h-0 overflow-y-auto">{children}</main>
    </div>
  );
}
