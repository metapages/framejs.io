import { useEffect } from "react";

import {
  deleteHashParamFromUrl,
  getHashParamValueBooleanFromWindow,
} from "@metapages/hash-query";

declare global {
  interface Window {
    __SHORT_URL_ID?: string;
  }
}

// Check for short URL ID on this window or the parent frame (when editor is an iframe)
const getShortUrlId = (): string | undefined => {
  try {
    if (window.parent !== window && window.parent.__SHORT_URL_ID) {
      return window.parent.__SHORT_URL_ID;
    }
  } catch {
    // cross-origin parent
  }
  return window.__SHORT_URL_ID;
};

// Navigate to the full root URL using the editor's current hash state.
// This exits short URL mode using what is currently in the editor, not
// a value re-downloaded from S3 (which would override editor state).
const exitShortUrlMode = (): void => {
  const currentHash = window.location.hash;
  const target = window.parent !== window ? window.parent : window;
  target.location.href =
    target.location.origin + "/#" + currentHash.replace(/^#/, "");
};

// Is the editor open? Read through @metapages/hash-query — hash params are never
// parsed by hand (see https://framejs.io/docs/guide/url-state).
const isEditing = (): boolean =>
  getHashParamValueBooleanFromWindow("edit") === true;

// The current hash with `edit` removed, for content comparison — opening the
// editor must not read as a content change.
const contentHash = (): string =>
  deleteHashParamFromUrl(window.location.href, "edit").hash;

// Detects short URL mode and navigates to the full hash URL only when content
// changes while edit mode is active. Adding edit=true alone (no content change)
// does not trigger navigation, letting the editor open without leaving the short URL.
export const useShortUrlMode = (): void => {
  useEffect(() => {
    const id = getShortUrlId();
    if (!id) return;

    // EMBEDDED: do nothing. The runtime owns the page url.
    //
    // This hook exists to expand a short url into a full hash url when the user
    // starts editing, and `exitShortUrlMode` below does that by navigating the
    // PARENT to a url built from THIS EDITOR'S hash. That was survivable while
    // the editor's hash carried the frame's source. It is now catastrophic: the
    // source travels over postMessage (see useFrameSource) and the runtime
    // strips `js` from the editor's url, so the url this would navigate to has
    // NO CODE — the parent loses the frame, the embedder sees that as an edit,
    // and the frame is saved empty. Observed: with the editor open on a short
    // url the parent ended up at `/#?hm=disabled&edit=true&editorWidth=40vw`,
    // no `js`, frame not running.
    //
    // It is also redundant now. Edit mode on a short url is handled by the
    // runtime itself (`nonOverridableParams` + `mountEditor` in
    // worker/index.html), and edits reach the runtime as a metaframe output
    // rather than by rewriting a url.
    //
    // Nothing is lost by returning here: `getShortUrlId()` only finds an id via
    // `window.parent`, or on a page the worker injected it into — so a
    // standalone editor never reaches this code at all.
    if (window.parent !== window) return;

    // If already in edit mode on page load, navigate immediately
    if (isEditing()) {
      exitShortUrlMode();
      return;
    }

    const initialContent = contentHash();

    const onHashChange = () => {
      if (isEditing() && contentHash() !== initialContent) {
        exitShortUrlMode();
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
};
