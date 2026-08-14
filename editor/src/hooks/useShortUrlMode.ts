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
