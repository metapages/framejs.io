import { useCallback, useEffect, useRef } from "react";

import { useStore } from "/@/store";
import {
  fetchFrameSource,
  isJsSourceUrl,
  RESERVED_SOURCE_INPUT,
  RESERVED_SOURCE_OUTPUT,
} from "/@/utils/frameSource";

import {
  getHashParamValueBase64DecodedFromUrl,
  setHashParamValueBase64EncodedInUrl,
} from "@metapages/hash-query";
import { useMetaframe } from "@metapages/metapage-react/hooks";

/**
 * The frame's source, and the only way to change it.
 *
 * REPLACES `useHashParamBase64("js")` throughout this editor. `js` is no longer
 * a hash param here at all: the source has no size bound and a url is not a
 * transport for one — base64(encodeURIComponent(...)) is ~2.4x, so 1.65 MB of
 * code becomes a 3.9 MB url, past Chrome's 2 MiB navigation cap (an iframe
 * pointed at one lands on `about:blank#blocked`: an empty pane, no console
 * error) and past Firefox's 1 MiB url-parser limit, which throws.
 *
 * Carrying it in the url failed in a way worth recording, because two narrower
 * fixes did not hold. Keeping the stored REFERENCE in the url instead of the
 * expanded source was not enough: the first edit puts real source in the hash
 * and the runtime adopts it, so reopening the editor in the same page built the
 * oversize url again. Stripping `js` from the editor's url was not enough
 * either. Only removing the url from the path entirely makes the failure
 * impossible rather than unlikely.
 *
 * So the source arrives as a metaframe INPUT and leaves as a metaframe OUTPUT —
 * postMessage, which has no length limit. The runtime owns the page url and is
 * the one that writes `js` into it, which is what framejs.app persists.
 *
 * `undefined` means NOT KNOWN YET, and is not the empty string. Callers that
 * persist the frame must refuse on it (see `useFrameSourceRequired`).
 */
export const useFrameSource = (): [
  string | undefined,
  (source: string) => void,
] => {
  const source = useStore((state) => state.frameSource);
  const setFrameSource = useStore((state) => state.setFrameSource);
  const metaframeBlob = useMetaframe();
  const metaframe = metaframeBlob.metaframe;

  const setSource = useCallback(
    (next: string) => {
      setFrameSource(next);
      if (metaframe?.setOutput) {
        // The normal path: hand the edit to the runtime over postMessage.
        metaframe.setOutput(RESERVED_SOURCE_OUTPUT, next);
        return;
      }
      // Standalone (this editor opened at its own url, with no runtime around
      // it): there is nobody to hand it to, so the hash is the only place it
      // can live. Small frames only, by definition — a large one could not have
      // arrived this way.
      const url = setHashParamValueBase64EncodedInUrl(
        window.location.href,
        "js",
        next,
      );
      window.history.replaceState(
        null,
        document.title,
        typeof url === "string" ? url : url.href,
      );
    },
    [metaframe, setFrameSource],
  );

  return [source, setSource];
};

/**
 * Seed the store from the runtime, once. Called from App, next to the other
 * one-shot wiring hooks.
 */
export const useFrameSourceSeed = (): void => {
  const setFrameSource = useStore((state) => state.setFrameSource);
  const metaframeBlob = useMetaframe();
  const metaframe = metaframeBlob.metaframe;
  // Once per page load: a later pass could clobber an edit in flight.
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    let cancelled = false;

    const apply = (value: string | undefined) => {
      // An empty string is a legitimate source (an empty frame), so only
      // `undefined` is rejected here — but it must not overwrite a real value.
      if (cancelled || value === undefined || seeded.current) return;
      seeded.current = true;
      setFrameSource(value);
    };

    // 1. The reserved input from the runtime — the normal path.
    const fromInput = metaframe?.getInputs?.()?.[RESERVED_SOURCE_INPUT];
    if (typeof fromInput === "string") {
      apply(fromInput);
      return;
    }

    const disposers: Array<() => void> = [];
    if (metaframe?.onInputs) {
      const dispose = metaframe.onInputs((inputs: Record<string, unknown>) => {
        const value = inputs?.[RESERVED_SOURCE_INPUT];
        if (typeof value === "string") apply(value);
      });
      if (typeof dispose === "function") disposers.push(dispose);
    }

    // 2. Fall back to this url's own `js`, for an editor opened directly rather
    // than mounted by the runtime. Resolve a hoisted reference the same way the
    // runtime does, so the editor shows code and never a URL — handing a URL to
    // the save button would persist it AS the frame's source.
    const fromHash = getHashParamValueBase64DecodedFromUrl(
      window.location.href,
      "js",
    );
    if (fromHash !== undefined) {
      if (isJsSourceUrl(fromHash)) {
        fetchFrameSource(fromHash).then(apply);
      } else {
        apply(fromHash);
      }
    } else if (window.parent === window) {
      // Truly standalone: opened at its own url, with no runtime around it and
      // no `js` to resolve, so nothing will ever arrive. An empty frame is the
      // right answer.
      //
      // Gated on the WINDOW, not on `!metaframe`. `metaframe` is also absent on
      // the first render, before it connects — and settling empty there leaves
      // a frame showing no code at all, because `apply` latches `seeded` and
      // the real source arriving a moment later is then ignored. The window
      // check is synchronous and cannot be mistaken for "not yet".
      apply("");
    }

    return () => {
      cancelled = true;
      disposers.forEach((d) => d());
    };
  }, [metaframe, setFrameSource]);
};

/**
 * The source, or null when it is not known yet — for the two buttons that
 * PERSIST the frame (save, shorten).
 *
 * They used to read `js` out of the hash purely to check it was non-empty, and
 * then serialize `window.location.hash` as the payload. With the source off the
 * url, serializing the hash alone would persist a frame with NO CODE, which for
 * an existing frame means destroying it. So they take the source from here and
 * inject it into the hash they build, and refuse outright when it is null.
 */
export const useFrameSourceForPersist = (): string | null => {
  const [source] = useFrameSource();
  if (source === undefined) return null;
  if (!source.trim()) return null;
  return source;
};
