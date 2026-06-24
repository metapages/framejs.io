import { useState } from "preact/hooks";
import type { OpenGraph } from "@/lib/frame.ts";
import FrameSideBar, { SideButton } from "@/components/FrameSideBar.tsx";

interface FrameBookmarkProps {
  og: OpenGraph;
  // Full framejs.io URL (used for the copy button).
  url?: string;
  isPublic: boolean;
  createdAt?: string;
  // When set, the whole card is an <a> linking here.
  href?: string;
  onDelete?: () => void;
  onTogglePublic?: () => void;
  busy?: boolean;
}

function CopyIcon() {
  return (
    <svg
      class="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg
      class="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      class="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      class="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      class="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function FrameBookmark(
  { og, url, isPublic, createdAt, href, onDelete, onTogglePublic, busy }:
    FrameBookmarkProps,
) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function copyUrl() {
    if (!url) return;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  const cardClass =
    "relative flex-1 bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors min-w-0";

  const cardInner = (
    <>
      <div
        class="absolute top-3 right-3 text-gray-400"
        title={isPublic ? "Public" : "Private"}
      >
        {isPublic ? <GlobeIcon /> : <LockIcon />}
      </div>

      <div class="flex gap-4 pr-7">
        {og.image && (
          <img
            src={og.image}
            alt=""
            class="w-20 h-20 object-cover rounded-md border border-gray-100 shrink-0"
          />
        )}
        <div class="min-w-0">
          <p
            class={`text-lg font-medium break-words ${
              href ? "text-indigo-600" : "text-gray-900"
            }`}
          >
            {og.title || "Untitled frame"}
          </p>
          {og.description && (
            <p class="text-sm text-gray-600 mt-1 break-words">
              {og.description}
            </p>
          )}
          <p class="text-sm text-gray-500 mt-1">
            {isPublic ? "public" : "private"}
            {createdAt && (
              <>
                {" · "}
                {new Date(createdAt).toLocaleDateString()}
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );

  const hasMenu = onDelete || onTogglePublic;

  return (
    <div class="flex items-stretch gap-2">
      {href
        ? <a href={href} class={cardClass}>{cardInner}</a>
        : <div class={cardClass}>{cardInner}</div>}

      <FrameSideBar>
        {hasMenu && (
          <div class="relative">
            <SideButton
              onClick={() => setMenuOpen(!menuOpen)}
              title="More actions"
            >
              <HamburgerIcon />
            </SideButton>

            {menuOpen && (
              <>
                <div
                  class="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div class="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-40 overflow-hidden">
                  {onTogglePublic && (
                    <button
                      type="button"
                      onClick={() => {
                        onTogglePublic();
                        setMenuOpen(false);
                      }}
                      disabled={busy}
                      class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isPublic ? <LockIcon /> : <GlobeIcon />}
                      {isPublic ? "Make private" : "Make public"}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        onDelete();
                        setMenuOpen(false);
                      }}
                      disabled={busy}
                      class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <TrashIcon /> Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <SideButton
          onClick={copyUrl}
          title="Copy frame URL"
          disabled={!url}
        >
          {copied
            ? <span class="text-xs text-green-600 font-medium">✓</span>
            : <CopyIcon />}
        </SideButton>
      </FrameSideBar>
    </div>
  );
}
