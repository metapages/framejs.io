import React, { useEffect, useState } from "react";

import { InputsHashParam } from "/@/components/sections/settings/SectionInputs";
import { convertMetaframeInputs } from "/@/utils/convertInputs";
import {
  getAllowedHashParams,
  stripDisallowedHashParams,
} from "/@/utils/hashParams";

import { Box, Icon, Tooltip, useToast } from "@chakra-ui/react";
import {
  getHashParamValueJsonFromWindow,
  setHashParamValueInHashString,
  setHashParamValueJsonInHashString,
} from "@metapages/hash-query/react-hooks";
import { MetaframeDefinition } from "@metapages/metapage";
import { useMetaframe } from "@metapages/metapage-react/hooks";
import { FloppyDiskIcon } from "@phosphor-icons/react";

declare global {
  interface Window {
    __FRAMEJS_APP_ORIGIN?: string;
  }
}

// Matches a canonical UUID (8-4-4-4-12 hex). Keep in sync with the worker's
// UUID_REGEX (worker/server.ts).
const UUID_REGEX =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

// The short-URL id (uuid or sha256) the current page was loaded from, if any.
// Set by the worker on /j/:id pages; also read from the parent frame when the
// editor is embedded as an iframe (mirrors useShortUrlMode.getShortUrlId).
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

const getFramejsAppOrigin = (): string => {
  try {
    if (window.parent !== window && window.parent.__FRAMEJS_APP_ORIGIN) {
      return window.parent.__FRAMEJS_APP_ORIGIN;
    }
  } catch {
    // cross-origin parent
  }
  return window.__FRAMEJS_APP_ORIGIN || "https://framejs.app";
};

// Navigate the top-most window (so we escape the editor iframe when embedded).
const navigateTop = (url: string): void => {
  (window.top || window).location.href = url;
};

// "Save" button: persists the app as a mutable framejs.app frame.
//   - Loaded from /j/<uuid> (already a frame): push the current edits to that
//     frame, then open its framejs.app page.
//   - Raw hash params or legacy /j/<sha256>: mint a new frame from the current
//     state, then open it.
// The uuid case is best-effort: if the update is rejected (e.g. the frame has
// been claimed by an owner), we still open the existing framejs.app page.
export const ButtonSaveFrame: React.FC<{
  iconSize?: string;
  iconPadding?: string;
}> = ({ iconSize = "28px", iconPadding = "3px" }) => {
  const [loading, setLoading] = useState(false);
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

  // Build the cleaned hash-param string to persist (same logic as
  // ButtonShortenUrl): drop edit/hm, merge live metaframe inputs, strip any
  // params not whitelisted by the definition.
  const buildCleanHash = async (): Promise<string> => {
    let hash = window.location.hash.slice(1); // Remove leading "#"
    hash = setHashParamValueInHashString(hash, "edit", undefined);
    hash = setHashParamValueInHashString(hash, "hm", undefined);

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

    const definition = getHashParamValueJsonFromWindow<
      MetaframeDefinition | undefined
    >("definition");
    const allowed = getAllowedHashParams(definition);

    const tempUrl = `${window.location.origin}/#${hash}`;
    return new URL(stripDisallowedHashParams(tempUrl, allowed)).hash.slice(1);
  };

  const handleSave = async () => {
    const shortUrlId = getShortUrlId();
    const uuid =
      shortUrlId && UUID_REGEX.test(shortUrlId) ? shortUrlId : undefined;

    try {
      setLoading(true);

      const hash = await buildCleanHash();

      // Create the frame (no id) or update the existing frame (uuid). The
      // worker forwards to framejs.app server-side and returns its page URL.
      const response = await fetch("/api/frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashParams: hash, id: uuid }),
      });

      if (response.ok) {
        const data = await response.json();
        navigateTop(data.url);
        return;
      }

      // Save rejected. If it was already a frame, open it anyway.
      if (uuid) {
        navigateTop(`${getFramejsAppOrigin()}/j/${uuid}`);
        return;
      }
      throw new Error(`Failed to save frame (${response.status})`);
    } catch (error) {
      // For an existing frame, prefer opening it over surfacing an error.
      if (uuid) {
        navigateTop(`${getFramejsAppOrigin()}/j/${uuid}`);
        return;
      }
      console.error("Save frame error:", error);
      toast({
        title: "Failed to save",
        description: "Please try again later",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  return (
    <Tooltip label="Save to framejs.app">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        h="40px"
        onClick={loading ? undefined : handleSave}
        cursor={loading ? "not-allowed" : "pointer"}
      >
        <Icon
          aria-label="save frame"
          _hover={{ bg: "gray.300" }}
          bg={"none"}
          p={iconPadding}
          borderRadius={5}
          as={FloppyDiskIcon}
          boxSize={iconSize}
          opacity={loading ? 0.5 : 1}
        />
      </Box>
    </Tooltip>
  );
};
