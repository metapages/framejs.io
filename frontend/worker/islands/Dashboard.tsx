import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import Fuse from "fuse.js";
import { getBrowserSdk } from "@/lib/graphql/client.browser.ts";
import {
  errMessage,
  type FrameListItem,
  frameSlug,
  latestVersion,
  normalizeFrameUrl,
  ogFromFrameUrl,
} from "@/lib/frame.ts";
import { extractFrameJsSlug, resolveFrameUrl } from "@/lib/resolveFrameUrl.ts";
import FrameBookmark from "@/components/FrameBookmark.tsx";

function titleFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "Pasted frame";
  }
}

// How often the dashboard silently refetches the frame list.
const POLL_MS = 15_000;

interface DashboardProps {
  userId: string;
  framejsOrigin: string;
}

export default function Dashboard({ userId, framejsOrigin }: DashboardProps) {
  const frames = useSignal<FrameListItem[]>([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const query = useSignal("");
  const showCreate = useSignal(false);
  const newTitle = useSignal("");
  const newDescription = useSignal("");
  const newUrl = useSignal("");
  const creating = useSignal(false);
  const pasteCreating = useSignal(false);

  async function loadFrames(silent = false) {
    try {
      const { frame: rows } = await getBrowserSdk().GetFrames({ userId });
      frames.value = rows;
      error.value = "";
    } catch (e) {
      if (!silent) error.value = errMessage(e);
    } finally {
      loading.value = false;
    }
  }

  // Client-side keyword search over the frame list (title/description/url).
  const filtered = useComputed(() => {
    const q = query.value.trim();
    if (!q) return frames.value;
    const items = frames.value.map((frame) => {
      const { url, og } = latestVersion(frame);
      return {
        frame,
        title: og.title ?? "",
        description: og.description ?? "",
        url: url ?? "",
      };
    });
    const fuse = new Fuse(items, {
      keys: ["title", "description", "url"],
      threshold: 0.4,
      ignoreLocation: true,
    });
    return fuse.search(q).map((r) => r.item.frame);
  });

  async function createFrame() {
    if (!newTitle.value.trim() || !newUrl.value.trim()) return;
    creating.value = true;
    error.value = "";
    try {
      await getBrowserSdk().InsertFrame({
        object: {
          public: true,
          frame_versions: {
            data: [{
              url: normalizeFrameUrl(newUrl.value.trim(), framejsOrigin),
              og: {
                title: newTitle.value.trim(),
                description: newDescription.value.trim() || null,
              },
            }],
          },
        },
      });
      newTitle.value = "";
      newDescription.value = "";
      newUrl.value = "";
      showCreate.value = false;
      await loadFrames();
    } catch (e) {
      error.value = errMessage(e);
    } finally {
      creating.value = false;
    }
  }

  async function deleteFrame(id: string) {
    if (!confirm("Delete this frame?")) return;
    try {
      await getBrowserSdk().DeleteFrame({ id });
      await loadFrames();
    } catch (e) {
      error.value = errMessage(e);
    }
  }

  async function togglePublic(id: string, current: boolean) {
    try {
      await getBrowserSdk().SetFramePublic({ id, public: !current });
      // Optimistically flip in local state.
      frames.value = frames.value.map((f) =>
        f.id === id ? { ...f, public: !current } : f
      );
    } catch (e) {
      error.value = errMessage(e);
    }
  }

  useEffect(() => {
    loadFrames();
    const timer = setInterval(() => loadFrames(true), POLL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text?.startsWith("https://")) return;

      e.preventDefault();
      pasteCreating.value = true;
      error.value = "";
      try {
        const resolvedUrl = await resolveFrameUrl(text);
        // If it looked like a /j/ URL but resolution returned unchanged, bail.
        if (resolvedUrl === text && extractFrameJsSlug(text) !== null) {
          error.value = "Could not load frame content from that URL";
          pasteCreating.value = false;
          return;
        }
        const frameUrl = normalizeFrameUrl(resolvedUrl, framejsOrigin);
        const og = ogFromFrameUrl(frameUrl) ?? { title: titleFromUrl(text) };
        const result = await getBrowserSdk().InsertFrame({
          object: {
            public: true,
            frame_versions: { data: [{ url: frameUrl, og }] },
          },
        });
        const id = result.insert_frame_one?.id;
        if (id) {
          globalThis.location.href = `/j/${frameSlug(id)}`;
          return;
        }
      } catch (e) {
        error.value = errMessage(e);
      }
      pasteCreating.value = false;
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  if (loading.value) {
    return <p class="text-gray-500">Loading frames...</p>;
  }

  return (
    <div>
      <div class="flex items-center gap-4 mb-6">
        <input
          type="search"
          value={query.value}
          onInput={(e) => query.value = (e.target as HTMLInputElement).value}
          placeholder="Search frames..."
          class="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          style={{ maxWidth: "500px" }}
        />
        {/* gap-2 + w-8 spacer mirrors FrameBookmark's gap-2 + FrameSideBar width */}
        <div class="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => (showCreate.value = !showCreate.value)}
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
          >
            New Frame
          </button>
          <div class="w-8" />
        </div>
      </div>

      {pasteCreating.value && (
        <p class="text-sm text-indigo-600 mb-4">Creating frame from pasted URL...</p>
      )}
      {error.value && <p class="text-sm text-red-600 mb-4">{error.value}</p>}

      {showCreate.value && (
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div class="grid gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newTitle.value}
                onInput={(e) =>
                  newTitle.value = (e.target as HTMLInputElement).value}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="My awesome frame"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newDescription.value}
                onInput={(e) =>
                  newDescription.value = (e.target as HTMLInputElement).value}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="What this frame does"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                framejs.io URL
              </label>
              <input
                type="text"
                value={newUrl.value}
                onInput={(e) => {
                  const url = (e.target as HTMLInputElement).value;
                  newUrl.value = url;
                  if (!newTitle.value.trim()) {
                    const og = ogFromFrameUrl(url);
                    if (og?.title) newTitle.value = og.title;
                    if (og?.description && !newDescription.value.trim()) {
                      newDescription.value = og.description;
                    }
                  }
                }}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="https://framejs.io/#?..."
              />
            </div>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              onClick={createFrame}
              disabled={creating.value}
              class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50"
            >
              {creating.value ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => (showCreate.value = false)}
              class="text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {frames.value.length === 0
        ? (
          <div class="text-center py-12 text-gray-500">
            <p class="text-lg mb-2">No frames yet</p>
            <p class="text-sm">Create your first frame to get started.</p>
          </div>
        )
        : filtered.value.length === 0
        ? (
          <p class="text-center py-12 text-gray-500">
            No frames match "{query.value}".
          </p>
        )
        : (
          <div class="grid gap-4">
            {filtered.value.map((frame) => {
              const { url, og } = latestVersion(frame);
              return (
                <FrameBookmark
                  key={frame.id}
                  og={og}
                  url={`${framejsOrigin}/j/${frameSlug(frame.id)}`}
                  href={`/j/${frameSlug(frame.id)}`}
                  isPublic={frame.public}
                  createdAt={frame.created_at}
                  onDelete={() => deleteFrame(frame.id)}
                  onTogglePublic={() => togglePublic(frame.id, frame.public)}
                />
              );
            })}
          </div>
        )}
    </div>
  );
}
