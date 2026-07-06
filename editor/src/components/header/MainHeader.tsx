import React from "react";

import { useAiText } from "/@/hooks/useAiText";
import { useStore } from "/@/store";

import { Box, Button, HStack, Icon, Tooltip } from "@chakra-ui/react";
import { useHashParamBoolean } from "@metapages/hash-query/react-hooks";
import {
  FilePlusIcon,
  GearIcon,
  MagicWandIcon,
  QuestionMarkIcon,
  XIcon,
} from "@phosphor-icons/react";

import { ButtonCopyExternalLink } from "./components/ButtonCopyExternalLink";
import { ButtonSaveFrame } from "./components/ButtonSaveFrame";
import { ButtonShortenUrl } from "./components/ButtonShortenUrl";

export const capitalize = (str: string): string => {
  if (!str.length) return str;
  return str[0].toUpperCase() + str.slice(1, str.length);
};

export const MainHeader: React.FC = () => {
  const [_edit, setEdit] = useHashParamBoolean("edit");
  const { copyToClipboard } = useAiText();

  // only show the edit button if the command points to a script in the inputs
  const setShownPanel = useStore((state) => state.setShownPanel);
  const shownPanel = useStore((state) => state.shownPanel);
  const triggerFileUpload = useStore((state) => state.triggerFileUpload);

  const iconSize = "28px";
  const iconPadding = "3px";

  const icon = (
    svg: React.ElementType,
    tooltipText: string,
    callback: () => void,
    hover?: boolean,
    testId?: string,
  ) => {
    return (
      <Tooltip label={`${capitalize(tooltipText)}`} key={tooltipText}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="40px"
          data-testid={testId}
          onClick={callback}
          cursor="pointer"
        >
          <Icon
            _hover={{ bg: hover ? "gray.300" : "none" }}
            bg={tooltipText === shownPanel ? "gray.300" : "none"}
            p={iconPadding}
            borderRadius={5}
            as={svg}
            boxSize={iconSize}
          />
        </Box>
      </Tooltip>
    );
  };

  return (
    <HStack
      px={0}
      py={0}
      justify={"space-between"}
      alignItems={"center"}
      minWidth={"100%"}
      h={"40px"}
      bg={"var(--paper)"}
      borderBottom={"1px"}
      flexShrink={0}
    >
      <Button
        mx={3}
        onClick={() => setShownPanel(null)}
        variant={"ghost"}
        _hover={{ bg: "gray.100" }}
        fontFamily={"mono"}
        fontWeight={500}
        letterSpacing={"0.04em"}
        color={"gray.700"}
        fontSize={"sm"}
        h={"40px"}
        minH={0}
        flexShrink={0}
      >
        js
      </Button>
      <HStack
        borderLeft={"1px"}
        right={0}
        px={3}
        bg={"var(--paper)"}
        justifyContent={"space-around"}
        alignItems={"center"}
        h={"40px"}
        w={"auto"}
      >
        {icon(
          GearIcon,
          "settings",
          () => setShownPanel(shownPanel === "settings" ? null : "settings"),
          true,
        )}
        {icon(FilePlusIcon, "Embed File", () => triggerFileUpload(), true)}
        {icon(
          MagicWandIcon,
          "Copy Code to Clipboard for AI",
          () => copyToClipboard(),
          true,
          "ai-copy-button",
        )}
        <ButtonCopyExternalLink iconSize={iconSize} iconPadding={iconPadding} />
        {icon(
          QuestionMarkIcon,
          "docs",
          () => {
            const docsUrl = `${window.location.origin}/docs/`;
            // Open from `window`, not `window.top`: `window.top` is always a
            // truthy Window (so `|| window` never fires), and when the editor is
            // embedded cross-origin (e.g. framejs.app) reading `.open` off the
            // cross-origin top frame throws a SecurityError. `_blank` already
            // opens a top-level tab from inside the iframe.
            window.open(docsUrl, "_blank", "noopener,noreferrer");
          },
          true,
        )}
        <ButtonShortenUrl iconSize={iconSize} iconPadding={iconPadding} />
        <ButtonSaveFrame iconSize={iconSize} iconPadding={iconPadding} />
        {icon(XIcon, "close", () => setEdit(false))}
      </HStack>
    </HStack>
  );
};
