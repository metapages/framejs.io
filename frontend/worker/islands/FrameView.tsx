import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { getBrowserSdk } from "@/lib/graphql/client.browser.ts";
import {
  embedFrameUrl,
  errMessage,
  type FrameVersion,
  frameSlug,
  normalizeFrameUrl,
  ogFromFrameUrl,
  type OpenGraph,
} from "@/lib/frame.ts";
import FrameBookmark from "@/components/FrameBookmark.tsx";
import FrameSideBar, { SideButton } from "@/components/FrameSideBar.tsx";
import { extractFrameJsSlug, resolveFrameUrl } from "@/lib/resolveFrameUrl.ts";

interface FrameViewProps {
  frameId: string;
  initialPublic: boolean;
  // All versions, newest first (frame_versions order_by created_at desc).
  initialVersions: FrameVersion[];
  framejsBaseUrl: string;
}

// Debounce window for persisting live hash-param edits as a new frame_version.
const SAVE_DEBOUNCE_MS = 600;

export default function FrameView(
  { frameId, initialPublic, initialVersions, framejsBaseUrl }: FrameViewProps,
) {
  const versions = useSignal<FrameVersion[]>(initialVersions);
  const isPublic = useSignal(initialPublic);
  const error = useSignal("");
  const saving = useSignal(false);
  const saved = useSignal(false);
  const busy = useSignal(false);

  // The url currently embedded in the iframe. Changing it rebuilds the metapage
  // (used on undo); ordinary saves do NOT touch it, so editing is uninterrupted.
  const embedUrl = useSignal(normalizeFrameUrl(
    initialVersions[0]?.url,
    framejsBaseUrl,
  ));
  // The live framejs.io url shown under the bookmark / copied — tracks edits.
  const displayUrl = useSignal(embedUrl.value);

  const containerRef = useRef<HTMLDivElement>(null);
  // Normalized url of the newest persisted version; the change-detection anchor.
  const latestStoredRef = useRef(embedUrl.value);
  const saveTimer = useRef<number | undefined>(undefined);

  async function refetch() {
    try {
      const { frame_by_pk: frame } = await getBrowserSdk().GetFrameDetail({
        id: frameId,
      });
      if (frame) {
        versions.value = frame.frame_versions;
        isPublic.value = frame.public;
      }
    } catch (e) {
      error.value = errMessage(e);
    }
  }

  async function saveVersion(normalizedUrl: string) {
    if (normalizedUrl === latestStoredRef.current) return;
    latestStoredRef.current = normalizedUrl;
    saving.value = true;
    saved.value = false;
    try {
      const og = ogFromFrameUrl(normalizedUrl) ??
        (versions.value[0]?.og as OpenGraph | undefined) ?? {};
      await getBrowserSdk().InsertFrameVersion({
        object: { frame: frameId, url: normalizedUrl, og },
      });
      await refetch();
      saved.value = true;
      setTimeout(() => (saved.value = false), 2000);
    } catch (e) {
      error.value = errMessage(e);
    } finally {
      saving.value = false;
    }
  }

  function onLiveHashChange(rawUrl: string) {
    const normalized = normalizeFrameUrl(rawUrl, framejsBaseUrl);
    displayUrl.value = normalized;
    if (normalized === latestStoredRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(
      () => saveVersion(normalized),
      SAVE_DEBOUNCE_MS,
    );
  }

  // Build (and rebuild on undo) the embedded framejs.io metapage. Dynamically
  // imported so the browser-only metapage lib never evaluates during SSR.
  useEffect(() => {
    let disposed = false;
    let dispose = () => {};
    const url = embedUrl.value;

    (async () => {
      const { Metapage } = await import("@metapages/metapage");
      if (disposed || !containerRef.current) return;

      const mp = await Metapage.from({
        version: "1",
        metaframes: { f: { url: embedFrameUrl(url, framejsBaseUrl) } },
      });

      const client = mp.getMetaframe("f");
      const iframe = client?._iframe;
      if (iframe && containerRef.current) {
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "0";
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(iframe);
      }

      // DEFINITION fires whenever the runtime forwards a hash change upward.
      mp.addListener(Metapage.DEFINITION, (event: {
        definition?: { metaframes?: Record<string, { url?: string }> };
      }) => {
        const newUrl = event?.definition?.metaframes?.f?.url;
        if (newUrl) onLiveHashChange(newUrl);
      });

      dispose = () => {
        mp.dispose();
        if (containerRef.current) containerRef.current.innerHTML = "";
      };
      if (disposed) dispose();
    })();

    return () => {
      disposed = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      dispose();
    };
  }, [embedUrl.value]);

  async function undo() {
    const prev = versions.value[1];
    if (!prev) return;
    busy.value = true;
    error.value = "";
    try {
      // Re-stamp the previous version so it becomes the current (newest) one.
      await getBrowserSdk().TouchFrameVersion({
        id: prev.id,
        created_at: new Date().toISOString(),
      });
      const restored = normalizeFrameUrl(prev.url, framejsBaseUrl);
      latestStoredRef.current = restored;
      displayUrl.value = restored;
      await refetch();
      // Rebuild the iframe with the restored content.
      embedUrl.value = restored;
    } catch (e) {
      error.value = errMessage(e);
    } finally {
      busy.value = false;
    }
  }

  async function togglePublic() {
    busy.value = true;
    try {
      await getBrowserSdk().SetFramePublic({
        id: frameId,
        public: !isPublic.value,
      });
      isPublic.value = !isPublic.value;
    } catch (e) {
      error.value = errMessage(e);
    } finally {
      busy.value = false;
    }
  }

  async function deleteFrame() {
    if (!confirm("Delete this frame?")) return;
    busy.value = true;
    try {
      await getBrowserSdk().DeleteFrame({ id: frameId });
      globalThis.location.href = "/dashboard";
    } catch (e) {
      error.value = errMessage(e);
      busy.value = false;
    }
  }

  useEffect(() => {
    refetch();
  }, []);

  // Paste a /j/:sha256 or /j/:uuid URL → resolve and load as a new version.
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text?.startsWith("https://")) return;
      if (extractFrameJsSlug(text) === null) return;

      e.preventDefault();
      error.value = "";
      try {
        const resolved = await resolveFrameUrl(text);
        if (resolved === text) {
          error.value = "Could not load frame content from that URL";
          return;
        }
        const normalized = normalizeFrameUrl(resolved, framejsBaseUrl);
        // Save first (sets latestStoredRef so the iframe rebuild won't double-save)
        await saveVersion(normalized);
        displayUrl.value = normalized;
        embedUrl.value = normalized;
      } catch (err) {
        error.value = errMessage(err);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const og = (versions.value[0]?.og ?? {}) as OpenGraph;
  const canUndo = versions.value.length > 1;

  return (
    <div class="flex flex-col h-full max-w-6xl mx-auto w-full px-4 py-4">
      {/* Top bar: back button (left); save status (right). */}
      <div class="flex items-center justify-between gap-4 mb-4">
        <a
          href="/dashboard"
          class="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <span aria-hidden="true">←</span> Dashboard
        </a>
        <div class="flex items-center gap-2">
          {saving.value && <span class="text-sm text-gray-500">Saving...</span>}
          {saved.value && <span class="text-sm text-green-600">Saved</span>}
        </div>
      </div>

      {error.value && <p class="text-sm text-red-600 mb-2">{error.value}</p>}

      {/* The bookmark with action menu. */}
      <FrameBookmark
        og={og}
        url={`${framejsBaseUrl}/j/${frameSlug(frameId)}`}
        isPublic={isPublic.value}
        createdAt={versions.value[0]?.created_at}
        onDelete={deleteFrame}
        onTogglePublic={togglePublic}
        busy={busy.value}
      />

      {/* The embedded frame + undo side bar. */}
      <div class="flex items-stretch gap-2 flex-1 min-h-0 mt-6">
        <div
          ref={containerRef}
          class="flex-1 min-h-0 rounded-lg overflow-hidden border border-gray-200"
        />
        <FrameSideBar>
          <SideButton
            onClick={undo}
            disabled={!canUndo || busy.value}
            title="Undo to the previous version"
          >
            <svg
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
            </svg>
          </SideButton>
        </FrameSideBar>
      </div>
    </div>
  );
}
