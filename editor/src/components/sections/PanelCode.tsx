import React, { useCallback, useEffect, useRef, useState } from "react";

import { useFrameSource } from "/@/hooks/useFrameSource";
import { useMetaframeUrl } from "/@/hooks/useMetaframeUrl";
import { useOptions } from "/@/hooks/useOptions";
import { useReadOnly } from "/@/hooks/useReadOnly";
import { getFramejsAppOrigin } from "/@/utils/origin";

import {
  blobToBase64String,
  useHashParamBoolean,
} from "@metapages/hash-query/react-hooks";
import { MetaframeInputMap } from "@metapages/metapage";
import { MetaframeStandaloneComponent } from "@metapages/metapage-react";

export const PanelCode: React.FC = () => {
  const [code, setCode] = useFrameSource();
  const [edit] = useHashParamBoolean("edit");
  const readOnly = useReadOnly();
  const { url } = useMetaframeUrl();
  // NEVER mount the editor before the source is known.
  //
  // `undefined` means not-yet-arrived (it comes over postMessage, see
  // useFrameSource); the empty string means a genuinely empty frame. Mounting
  // with `code ?? ""` in that window DESTROYED FRAMES: the inner Monaco
  // metaframe runs with `autosend: true`, so it immediately emits its empty
  // buffer as an output, which travels back to the runtime and is committed as
  // an edit — saving a version with no code. Observed on a 1.6 MB frame, where
  // the source takes long enough to arrive that the race is reliably lost.
  //
  // So wait. The runtime sends the input immediately after mounting this
  // iframe, so the wait is imperceptible, and an empty editor pane for one
  // frame is not worth a wiped frame.
  if (code === undefined) {
    return edit ? <></> : <HowTo />;
  }
  // Nothing to render and the user isn't editing: show framejs.app's
  // embeddable getting-started guide (/howto) instead of an empty editor.
  if (!code.trim() && !edit) {
    return <HowTo />;
  }
  return url ? (
    <LocalEditor code={code} setCode={setCode} readOnly={readOnly} />
  ) : (
    <></>
  );
};

const HowTo: React.FC = () => (
  <div className="iframe-container">
    <iframe
      className="iframe"
      title="Getting started"
      src={`${getFramejsAppOrigin()}/howto`}
    />
  </div>
);

// How long to wait after the last keystroke before committing the code to the
// hash param (which re-runs the frame). Long enough to type a line without the
// frame reloading under you.
const CODE_COMMIT_DEBOUNCE_MS = 800;

const LocalEditor: React.FC<{
  code: string;
  setCode: (code: string) => void;
  /** Published version: show the code, refuse every edit. */
  readOnly: boolean;
}> = ({ code, setCode, readOnly }) => {
  const [themeOptions] = useOptions();
  // Track what the editor last sent us, so we can distinguish editor-initiated
  // changes from external changes (e.g. file upload injecting code comments)
  const lastEditorOutput = useRef<string>(code);
  const [editorInputs, setEditorInputs] = useState<{ text: string }>({
    text: code,
  });

  // Sync external code changes (e.g. file upload) to the editor, but skip
  // changes that originated from the editor itself to avoid clobbering
  useEffect(() => {
    if (code !== lastEditorOutput.current) {
      setEditorInputs({ text: code });
    }
  }, [code]);

  const urlWithOptions = useCallback(() => {
    const options = blobToBase64String({
      autosend: true,
      hidemenuififrame: true,
      mode: "javascript",
      theme: themeOptions?.theme || "vs-light",
      // Monaco's own readOnly: the buffer cannot be typed into at all, so there
      // is no edit to reject later. The editor metaframe also drops its send
      // button when this is set.
      readOnly,
    });
    return `https://editor.mtfm.io/#?hm=disabled&options=${options}`;
  }, [themeOptions, readOnly]);

  // Debounce commits: the embedded editor emits on every keystroke, and each
  // commit rewrites the URL and reloads the running frame.
  const commitTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(commitTimer.current), []);

  const onCodeOutputsUpdate = useCallback(
    (outputs: MetaframeInputMap) => {
      // Belt and braces next to Monaco's readOnly: a published version's code
      // must never be written back to the hash, which is what the runtime (and
      // through it framejs.app) would persist.
      if (readOnly) return;
      // Record immediately so the external-change effect above doesn't bounce
      // our own in-flight edit back into the editor.
      lastEditorOutput.current = outputs.text;
      clearTimeout(commitTimer.current);
      commitTimer.current = setTimeout(
        () => setCode(outputs.text),
        CODE_COMMIT_DEBOUNCE_MS,
      );
    },
    [setCode, readOnly],
  );

  return (
    <MetaframeStandaloneComponent
      url={urlWithOptions()}
      inputs={editorInputs}
      onOutputs={onCodeOutputsUpdate}
      style={{
        backgroundColor: "white",
        height: "100%",
        width: "100%",
      }}
    />
  );
};
