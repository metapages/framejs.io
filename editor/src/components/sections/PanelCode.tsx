import React, { useCallback, useEffect, useRef, useState } from "react";

import { useMetaframeUrl } from "/@/hooks/useMetaframeUrl";
import { useOptions } from "/@/hooks/useOptions";
import { getFramejsAppOrigin } from "/@/utils/origin";

import {
  blobToBase64String,
  useHashParamBase64,
  useHashParamBoolean,
} from "@metapages/hash-query/react-hooks";
import { MetaframeInputMap } from "@metapages/metapage";
import { MetaframeStandaloneComponent } from "@metapages/metapage-react";

export const PanelCode: React.FC = () => {
  let [code, setCode] = useHashParamBase64("js");
  const [edit] = useHashParamBoolean("edit");
  const { url } = useMetaframeUrl();
  // deal with bad double encoded data from old version of hash-query
  if (
    code &&
    (code.startsWith("%") ||
      (code.indexOf("\n") === -1 && code.indexOf("%") > -1))
  ) {
    code = decodeURIComponent(code);
  }
  // Nothing to render yet and the user isn't editing: show framejs.app's
  // embeddable getting-started guide (/howto) instead of an empty editor.
  if ((!code || !code.trim()) && !edit) {
    return <HowTo />;
  }
  return url ? <LocalEditor code={code} setCode={setCode} /> : <></>;
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
}> = ({ code, setCode }) => {
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
    });
    return `https://editor.mtfm.io/#?hm=disabled&options=${options}`;
  }, [themeOptions]);

  // Debounce commits: the embedded editor emits on every keystroke, and each
  // commit rewrites the URL and reloads the running frame.
  const commitTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(commitTimer.current), []);

  const onCodeOutputsUpdate = useCallback(
    (outputs: MetaframeInputMap) => {
      // Record immediately so the external-change effect above doesn't bounce
      // our own in-flight edit back into the editor.
      lastEditorOutput.current = outputs.text;
      clearTimeout(commitTimer.current);
      commitTimer.current = setTimeout(
        () => setCode(outputs.text),
        CODE_COMMIT_DEBOUNCE_MS,
      );
    },
    [setCode],
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
