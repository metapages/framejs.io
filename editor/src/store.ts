import { create } from "zustand";

interface MainStore {
  /**
   * The frame's JavaScript source — the editor's single source of truth.
   *
   * Deliberately NOT a hash param. The source has no size bound, and a url is
   * not a transport for one: base64(encodeURIComponent(...)) is about 2.4x, so
   * 1.65 MB of code becomes a 3.9 MB url, past Chrome's 2 MiB navigation cap
   * and Firefox's 1 MiB url-parser limit. It reaches this editor as a metaframe
   * INPUT and leaves as a metaframe OUTPUT — postMessage, no limit.
   *
   * `undefined` means "not known yet" (the input has not arrived and there is
   * nothing in the hash to fall back on), which is NOT the same as the empty
   * string. Anything that would persist the frame must refuse on `undefined`,
   * or it writes a frame with no code.
   */
  frameSource: string | undefined;
  setFrameSource: (source: string | undefined) => void;
  setShownPanel: (shownPanel: string | null) => void;
  shownPanel: string;
  fileUploadTrigger: (() => void) | null;
  setFileUploadTrigger: (trigger: (() => void) | null) => void;
  triggerFileUpload: () => void;
}

export const useStore = create<MainStore>((set, get) => ({
  setShownPanel: (shownPanel: string | null) => {
    set(() => ({ shownPanel }));
  },
  shownPanel: null,
  frameSource: undefined,
  setFrameSource: (frameSource: string | undefined) => {
    set(() => ({ frameSource }));
  },
  fileUploadTrigger: null,
  setFileUploadTrigger: (trigger: (() => void) | null) => {
    set(() => ({ fileUploadTrigger: trigger }));
  },
  triggerFileUpload: () => {
    const trigger = get().fileUploadTrigger;
    if (trigger) trigger();
  },
}));
