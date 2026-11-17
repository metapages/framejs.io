import React from "react";

import { InputsHashParam } from "/@/components/sections/settings/SectionInputs";
import { useMetaframeUrl } from "/@/hooks/useMetaframeUrl";
import { useFrameInputs } from "/@/hooks/useFrameInputs";
import { buildInputsHashParam } from "/@/utils/convertInputs";
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
import { CopyIcon } from "@phosphor-icons/react";

import { HeaderButtonProps, HeaderMenuItem } from "./types";

async function buildExternalShareUrl(
  url: string | undefined,
  metaframeInputs: Record<string, unknown> | undefined,
): Promise<string> {
  if (!url) return "";
  let newUrl = setHashParamValueInHashString(url, "edit", undefined);
  const newInputs = await buildInputsHashParam(
    getHashParamValueJsonFromWindow<InputsHashParam | undefined>("inputs"),
    metaframeInputs,
  );
  if (newInputs) {
    newUrl = setHashParamValueJsonInHashString(newUrl, "inputs", newInputs);
  }

  // Strip any hash params not in the metaframe.json defaults or the user's
  // `definition` whitelist.
  const definition = getHashParamValueJsonFromWindow<
    MetaframeDefinition | undefined
  >("definition");
  newUrl = stripDisallowedHashParams(newUrl, getAllowedHashParams(definition));

  return newUrl;
}

export const ButtonCopyExternalLink: React.FC<HeaderButtonProps> = ({
  iconSize = "28px",
  iconPadding = "3px",
  variant = "icon",
}) => {
  const { url } = useMetaframeUrl();
  const metaframeInputs = useFrameInputs();

  const toast = useToast();

  const handleCopy = async () => {
    try {
      const urlForCopy = await buildExternalShareUrl(url, metaframeInputs);
      await navigator.clipboard.writeText(urlForCopy);
      toast({
        title: "Copied URL to clipboard",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Could not copy URL",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (variant === "menuitem") {
    return (
      <HeaderMenuItem icon={CopyIcon} label={"Copy URL"} onClick={handleCopy} />
    );
  }

  return (
    <Tooltip label={"Copy URL"}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        h="40px"
        onClick={handleCopy}
        cursor="pointer"
      >
        <Icon
          aria-label="copy url"
          _hover={{ bg: "gray.300" }}
          bg={"none"}
          p={iconPadding}
          borderRadius={5}
          as={CopyIcon}
          boxSize={iconSize}
        />
      </Box>
    </Tooltip>
  );
};
