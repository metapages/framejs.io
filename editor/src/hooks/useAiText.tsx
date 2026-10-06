import { useCallback, useEffect, useState } from "react";
import { useFrameSource } from "/@/hooks/useFrameSource";

import { useToast } from "@chakra-ui/react";
import {
  getHashParamValueJsonFromWindow,
  useHashParamBase64,
} from "@metapages/hash-query/react-hooks";
import { useMetaframe } from "@metapages/metapage-react/hooks";

import { DataRef } from "../components/sections/settings/SectionInputs";

const llmsCode = `// Your code here:
export const onInputs = (inputs) => {
  // Your implementation
};`;

function formatInputForPrompt(value: unknown): string {
  // DataRef: duck-typed as object with .value property
  if (value && typeof value === "object" && "value" in value) {
    const ref = value as DataRef;
    const type = ref.type ?? "utf8";
    switch (type) {
      case "utf8":
      case "inline":
        return typeof ref.value === "string"
          ? ref.value.substring(0, 4000)
          : JSON.stringify(ref.value).substring(0, 4000);
      case "json":
        return JSON.stringify(ref.value).substring(0, 4000);
      case "base64":
        return `[base64 data, ${String(ref.value).length} chars encoded]`;
      case "url":
        return `[URL: ${ref.value}]`;
      default:
        return JSON.stringify(ref.value).substring(0, 4000);
    }
  }
  if (value instanceof Blob) {
    return `[Blob: type=${value.type}, size=${value.size} bytes]`;
  }
  if (ArrayBuffer.isView(value)) {
    return `[${value.constructor.name}: ${value.byteLength} bytes]`;
  }
  if (value instanceof ArrayBuffer) {
    return `[ArrayBuffer: ${value.byteLength} bytes]`;
  }
  if (typeof value === "string") {
    return value.substring(0, 4000);
  }
  return JSON.stringify(value).substring(0, 4000);
}

export const useAiText = (): {
  aiText: string;
  copyToClipboard: () => Promise<void>;
} => {
  const [aiBaseContent, setAiBaseContent] = useState<string>("");
  const [code] = useFrameSource();
  const [fullAiText, setFullAiText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const metaframeBlob = useMetaframe();

  useEffect(() => {
    const fetchLlmsContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/llms-prompt.md");
        if (!response.ok) {
          throw new Error("Failed to fetch llms-prompt.md");
        }
        const text = await response.text();
        // setAiBaseContent(text.replace(llmsCode, ""));
        setAiBaseContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLlmsContent();
  }, []);
  useEffect(() => {
    if (!aiBaseContent) {
      return;
    }
    if (code) {
      setFullAiText(aiBaseContent.replace(llmsCode, "") + code);
    } else {
      setFullAiText(aiBaseContent);
    }
  }, [code, aiBaseContent]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      if (!fullAiText) return;
      let text = fullAiText;
      // Merge URL hash inputs + accumulated metaframe inputs
      let allInputs: Record<string, any> = {};
      try {
        const inputsFromUrl =
          getHashParamValueJsonFromWindow<Record<string, DataRef>>("inputs");
        if (inputsFromUrl) {
          allInputs = { ...inputsFromUrl };
        }
      } catch (err) {
        console.error("Error getting inputs from url", err);
      }
      // Overlay live metaframe inputs (they take precedence)
      // getInputs() returns the metaframe's accumulated state, updated in real-time
      const mfInputs = metaframeBlob.metaframe?.getInputs();
      if (mfInputs) {
        for (const [key, value] of Object.entries(mfInputs)) {
          allInputs[key] = value;
        }
      }

      if (Object.keys(allInputs).length > 0) {
        let inputsString = "";
        Object.entries(allInputs).forEach(([key, value]) => {
          inputsString += `  - ${key}: ${formatInputForPrompt(value)}\n`;
        });

        text = text.replace(
          "<insert current inputs here, if any>",
          `\n *\n All metaframe inputs (not always at the same time):\n${inputsString.length < 8000 ? inputsString : inputsString.substring(0, 8000) + "..."}`,
        );
      }

      await navigator.clipboard.writeText(text);
      toast({
        title: "AI Prompt copied to clipboard",
        description:
          "Now paste into e.g. Claude Code or ChatGPT, or any other coding AI tool",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error copying to clipboard", err);
      toast({
        title: "Failed to copy to clipboard",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [fullAiText, toast, metaframeBlob.metaframe]);

  return { aiText: fullAiText, copyToClipboard: handleCopyToClipboard };
};
