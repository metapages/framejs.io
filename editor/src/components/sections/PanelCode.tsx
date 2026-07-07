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

  const onCodeOutputsUpdate = useCallback(
    (outputs: MetaframeInputMap) => {
      lastEditorOutput.current = outputs.text;
      setCode(outputs.text);
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
