import { useHashParamBoolean } from "@metapages/hash-query/react-hooks";

/**
 * `readonly=true` — the code may be READ but never edited.
 *
 * Set by whoever serves the frame when its content is fixed: the worker on a
 * published version (`/j/<uuid>?v=<sha256>`, immutable by definition), or
 * framejs.app's frame page embedding one. The runtime copies the frame's hash
 * into this editor's own URL, so the flag arrives here for free.
 *
 * Read-only is a property of the CONTENT, not of this editor: anything that
 * would change the code (typing, uploading a file, saving a frame) is removed
 * rather than left to fail, and the header says so out loud.
 */
export const useReadOnly = (): boolean => {
  const [readOnly] = useHashParamBoolean("readonly");
  return !!readOnly;
};
