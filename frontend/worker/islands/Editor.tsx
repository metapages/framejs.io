import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

interface EditorProps {
  projectId: string;
  projectKey: string;
  title: string;
  hashParams: string | null;
  storageFileId: string | null;
  editorBaseUrl: string;
  isOwner: boolean;
  nhostSubdomain: string;
  nhostRegion: string;
}

function getGraphqlUrl(subdomain: string, region: string): string {
  if (region) {
    return `https://${subdomain}.hasura.${region}.nhost.run/v1/graphql`;
  }
  return `https://${subdomain}.hasura.nhost.run/v1/graphql`;
}

function getAccessToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)nhostAccessToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function Editor({
  projectId,
  title,
  hashParams,
  editorBaseUrl,
  isOwner,
  nhostSubdomain,
  nhostRegion,
}: EditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saving = useSignal(false);
  const saved = useSignal(false);

  // Build the editor URL with hash params
  const editorUrl = hashParams
    ? `${editorBaseUrl}/#?${hashParams}`
    : editorBaseUrl;

  const graphqlUrl = getGraphqlUrl(nhostSubdomain, nhostRegion);

  async function saveHashParams(newHashParams: string) {
    saving.value = true;
    saved.value = false;
    const token = getAccessToken();
    try {
      await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: `mutation($id: uuid!, $hashParams: String!) {
            update_projects_by_pk(pk_columns: {id: $id}, _set: {hash_params: $hashParams, updated_at: "now()"}) {
              id
            }
          }`,
          variables: { id: projectId, hashParams: newHashParams },
        }),
      });
      saved.value = true;
      setTimeout(() => (saved.value = false), 2000);
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      saving.value = false;
    }
  }

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!isOwner) return;
      // Listen for save messages from the editor iframe
      if (event.data?.type === "hashchange" && event.data.hash) {
        const hash = event.data.hash.startsWith("#?")
          ? event.data.hash.slice(2)
          : event.data.hash.startsWith("#")
          ? event.data.hash.slice(1)
          : event.data.hash;
        saveHashParams(hash);
      }
    }
    globalThis.addEventListener("message", handleMessage);
    return () => globalThis.removeEventListener("message", handleMessage);
  }, [isOwner, projectId]);

  return (
    <div class="flex flex-col h-[calc(100vh-8rem)]">
      <div class="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <h1 class="text-lg font-medium">{title}</h1>
        {isOwner && (
          <div class="flex items-center gap-2">
            {saving.value && (
              <span class="text-sm text-gray-500">Saving...</span>
            )}
            {saved.value && <span class="text-sm text-green-600">Saved</span>}
            <button
              type="button"
              onClick={() => {
                // Manually trigger save by reading current iframe hash
                const iframe = iframeRef.current;
                if (iframe?.contentWindow) {
                  try {
                    const hash = iframe.contentWindow.location.hash;
                    if (hash) {
                      const params = hash.startsWith("#?")
                        ? hash.slice(2)
                        : hash.slice(1);
                      saveHashParams(params);
                    }
                  } catch {
                    // Cross-origin: request hash via postMessage
                    iframe.contentWindow.postMessage(
                      { type: "getHash" },
                      "*",
                    );
                  }
                }
              }}
              class="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        )}
      </div>
      <iframe
        ref={iframeRef}
        src={editorUrl}
        class="flex-1 w-full border-0"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}
