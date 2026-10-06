import { useEffect, useState } from "react";
import { useFrameSource } from "/@/hooks/useFrameSource";

import {
  deleteHashParamFromUrl,
  setHashParamValueBase64EncodedInUrl,
  setHashParamValueJsonInUrl,
  useHashParamJson,
} from "@metapages/hash-query/react-hooks";
import { MetaframeDefinitionV1 } from "@metapages/metapage";

import { DataRef } from "../components/sections/settings/SectionInputs";

export const useMetaframeUrl = () => {
  const [url, setUrl] = useState<string>();
  const [code] = useFrameSource();
  const [metaframeDef] = useHashParamJson<MetaframeDefinitionV1>("definition");
  const [modules] = useHashParamJson<string[]>("modules");
  const [inputs] = useHashParamJson<Record<string, DataRef>>("inputs");

  // update the url
  useEffect(() => {
    let url = new URL(window.location.href);
    if (metaframeDef) {
      url = setHashParamValueJsonInUrl(url, "definition", metaframeDef);
    }
    if (modules) {
      url = setHashParamValueJsonInUrl(url, "modules", modules);
    }
    if (inputs) {
      url = setHashParamValueJsonInUrl(url, "inputs", inputs);
    }
    // I am not sure about this anymore
    url.pathname = "";
    // url.host = (import.meta as any).env.VITE_SERVER_ORIGIN.split(":")[0];
    // url.port = (import.meta as any).env.VITE_SERVER_ORIGIN.split(":")[1];

    // let href = url.href;
    // WATCH THIS DIFFERENCE BETWEEN THIS AND BELOW
    // 1!
    if (code) {
      let checkedCode = code;
      if (
        code &&
        (code.startsWith("%") ||
          (code.indexOf("\n") === -1 && code.indexOf("%") > -1))
      ) {
        checkedCode = decodeURIComponent(code);
      }
      url = setHashParamValueBase64EncodedInUrl(url, "js", checkedCode);
    }
    // Remove the c and v hash params since they are set in the searchParams
    url = deleteHashParamFromUrl(url, "c");
    url = deleteHashParamFromUrl(url, "v");
    setUrl(url.href);
  }, [code, metaframeDef, modules, inputs, setUrl]);

  return { url };
};
