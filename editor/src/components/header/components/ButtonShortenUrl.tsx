import React, { useEffect, useState } from "react";

import { InputsHashParam } from "/@/components/sections/settings/SectionInputs";
import { convertMetaframeInputs } from "/@/utils/convertInputs";
import {
  getAllowedHashParams,
  stripDisallowedHashParams,
} from "/@/utils/hashParams";

import {
  Box,
  Icon,
  Link,
  Tooltip,
  useClipboard,
  useToast,
} from "@chakra-ui/react";
import { getHashParamValueBase64DecodedFromUrl } from "@metapages/hash-query";
import {
  getHashParamValueJsonFromWindow,
  setHashParamValueInHashString,
  setHashParamValueJsonInHashString,
} from "@metapages/hash-query/react-hooks";
import { MetaframeDefinition } from "@metapages/metapage";
import { useMetaframe } from "@metapages/metapage-react/hooks";
import { UploadIcon } from "@phosphor-icons/react";

export const ButtonShortenUrl: React.FC<{
  iconSize?: string;
  iconPadding?: string;
}> = ({ iconSize = "28px", iconPadding = "3px" }) => {
  const [loading, setLoading] = useState(false);
  const [shortenedUrl, setShortenedUrl] = useState("");
  const { onCopy } = useClipboard(shortenedUrl);
  const toast = useToast();
  const metaframeBlob = useMetaframe();
  const [metaframeInputs, setMetaframeInputs] = useState<
    InputsHashParam | undefined
  >(undefined);

  useEffect(() => {
    if (metaframeBlob.metaframe) {
      setMetaframeInputs(metaframeBlob.metaframe.getInputs());
      return metaframeBlob.metaframe.onInputs(() => {
        setMetaframeInputs(metaframeBlob.metaframe.getInputs());
      });
    }
  }, [metaframeBlob.metaframe]);

  const handleShorten = async () => {
    // With no code in the editor there's nothing to shorten/save. Surface a
    // gentle notice instead of the generic error toast.
    const code = getHashParamValueBase64DecodedFromUrl(
      window.location.href,
      "js",
    );
    if (!code || !code.trim()) {
      toast({
        title: "Empty: nothing to save",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);

      // Get current hash params and remove "edit" and "hm" (the edit-button
      // visibility setting) so a shortened URL never forces the edit button
      // to stay visible.
      let hash = window.location.hash.slice(1); // Remove leading "#"
      hash = setHashParamValueInHashString(hash, "edit", undefined);
      hash = setHashParamValueInHashString(hash, "hm", undefined);

      // Merge metaframe inputs (received via onInputs) into hash params
      let newInputs = getHashParamValueJsonFromWindow<
        InputsHashParam | undefined
      >("inputs");
      if (metaframeInputs && Object.keys(metaframeInputs).length > 0) {
        newInputs = await convertMetaframeInputs(
          metaframeInputs,
          newInputs || undefined,
        );
      }
      if (newInputs && Object.keys(newInputs).length > 0) {
        hash = setHashParamValueJsonInHashString(hash, "inputs", newInputs);
      }

      // Strip any hash params not in the metaframe.json defaults or the
      // user's `definition` whitelist (same logic as ButtonCopyExternalLink).
      const definition = getHashParamValueJsonFromWindow<
        MetaframeDefinition | undefined
      >("definition");
      const allowed = getAllowedHashParams(definition);

      const tempUrl = `${window.location.origin}/#${hash}`;
      hash = new URL(stripDisallowedHashParams(tempUrl, allowed)).hash.slice(1);

      // Store in S3 via API (SHA256 calculated on server)
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hashParams: hash,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to shorten URL");
      }

      // Get the SHA256 from the server response
      const data = await response.json();
      const sha256 = data.id;

      // Construct shortened URL and copy to clipboard
      const origin = window.location.origin;
      const shortUrl = `${origin}/j/${sha256}`;
      setShortenedUrl(shortUrl);

      // When embedded (e.g. the Jupyter/marimo widget), notify the host of the
      // freshly-minted short URL so it can persist it. The host is same-origin
      // to neither us nor /api/shorten, so it can't mint this itself — only the
      // editor (same-origin to the worker) can. Harmless if no host is listening.
      if (window.parent !== window) {
        window.parent.postMessage(
          { type: "metaframe-widget:shorturl", url: shortUrl },
          "*",
        );
      }

      // Copy to clipboard
      onCopy(shortUrl);
      setTimeout(() => {
        toast({
          title: "Shortened URL copied to clipboard",
          description: (
            <Link
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              fontSize="sm"
              isExternal
            >
              {shortUrl}
            </Link>
          ),
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }, 0);
    } catch (error) {
      console.error("Shorten URL error:", error);
      toast({
        title: "Failed to shorten URL",
        description: "Please try again later",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip label="Create expiring snapshot">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        h="40px"
        onClick={handleShorten}
        cursor={loading ? "not-allowed" : "pointer"}
      >
        <Icon
          aria-label="create expiring snapshot"
          _hover={{ bg: "gray.300" }}
          bg={"none"}
          p={iconPadding}
          borderRadius={5}
          as={UploadIcon}
          boxSize={iconSize}
          opacity={loading ? 0.5 : 1}
        />
      </Box>
    </Tooltip>
  );
};
