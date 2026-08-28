import React, { useEffect, useRef, useState } from "react";

import { useAiText } from "/@/hooks/useAiText";
import { useStore } from "/@/store";

import {
  Box,
  Button,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  Portal,
  Tooltip,
} from "@chakra-ui/react";
import { useHashParamBoolean } from "@metapages/hash-query/react-hooks";
import {
  CodeIcon,
  FilePlusIcon,
  GearIcon,
  ListIcon,
  MagicWandIcon,
  QuestionMarkIcon,
  XIcon,
} from "@phosphor-icons/react";

import { ButtonCopyExternalLink } from "./components/ButtonCopyExternalLink";
import { ButtonSaveFrame } from "./components/ButtonSaveFrame";
import { ButtonShortenUrl } from "./components/ButtonShortenUrl";
import { HeaderMenuItem } from "./components/types";

export const capitalize = (str: string): string => {
  if (!str.length) return str;
  return str[0].toUpperCase() + str.slice(1, str.length);
};

// Width (px) below which the icon row no longer fits and the header collapses
// to just [menu][close]. Roughly: the "js" button + 8 icons + padding.
const MIN_WIDTH_FOR_ICON_ROW = 420;

type HeaderAction = {
  /** Matches `shownPanel` for actions that toggle a panel, so the icon can be
      rendered as selected. */
  key: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  testId?: string;
};

export const MainHeader: React.FC = () => {
  const [_edit, setEdit] = useHashParamBoolean("edit");
  const { copyToClipboard } = useAiText();

  // only show the edit button if the command points to a script in the inputs
  const setShownPanel = useStore((state) => state.setShownPanel);
  const shownPanel = useStore((state) => state.shownPanel);
  const triggerFileUpload = useStore((state) => state.triggerFileUpload);

  // Collapse to a menu based on the header's own width (not the viewport):
  // the editor is often embedded in an iframe sized independently of the page.
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      setIsNarrow(entries[0].contentRect.width < MIN_WIDTH_FOR_ICON_ROW);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const iconSize = "28px";
  const iconPadding = "3px";

  const openDocs = () => {
    const docsUrl = `${window.location.origin}/docs/`;
    // Open from `window`, not `window.top`: `window.top` is always a
    // truthy Window (so `|| window` never fires), and when the editor is
    // embedded cross-origin (e.g. framejs.app) reading `.open` off the
    // cross-origin top frame throws a SecurityError. `_blank` already
    // opens a top-level tab from inside the iframe.
    window.open(docsUrl, "_blank", "noopener,noreferrer");
  };

  // The code panel is the default (no panel shown); in the wide layout it is
  // the "js" button on the left, in the narrow layout the first menu entry.
  const codeAction: HeaderAction = {
    key: "code",
    label: "code",
    icon: CodeIcon,
    onClick: () => setShownPanel(null),
  };
  const settingsAction: HeaderAction = {
    key: "settings",
    label: "settings",
    icon: GearIcon,
    onClick: () => setShownPanel(shownPanel === "settings" ? null : "settings"),
  };
  const embedFileAction: HeaderAction = {
    key: "embed-file",
    label: "Embed File",
    icon: FilePlusIcon,
    onClick: () => triggerFileUpload(),
  };
  const aiCopyAction: HeaderAction = {
    key: "ai-copy",
    label: "Copy Code to Clipboard for AI",
    icon: MagicWandIcon,
    onClick: () => copyToClipboard(),
    testId: "ai-copy-button",
  };
  const docsAction: HeaderAction = {
    key: "docs",
    label: "docs",
    icon: QuestionMarkIcon,
    onClick: openDocs,
  };

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

  const actionIcon = (action: HeaderAction) =>
    icon(action.icon, action.label, action.onClick, true, action.testId);

  const actionMenuItem = (action: HeaderAction) => (
    <HeaderMenuItem
      key={action.key}
      icon={action.icon}
      label={capitalize(action.label)}
      onClick={action.onClick}
      testId={action.testId}
    />
  );

  // Narrow layout: every action except close collapses into this menu.
  const overflowMenu = (
    <Menu placement="bottom-start" isLazy>
      {/* No Tooltip here: it would hover on top of the open menu. */}
      <MenuButton
        as={Box}
        display="flex"
        alignItems="center"
        justifyContent="center"
        h="40px"
        // MenuButton wraps its children in a span, whose line box would
        // otherwise be taller than the icon and push it off-centre — the
        // hamburger has to sit on the same baseline as the close button.
        lineHeight={0}
        cursor="pointer"
        data-testid="header-menu-button"
        aria-label="menu"
      >
        <Icon
          _hover={{ bg: "gray.300" }}
          p={iconPadding}
          borderRadius={5}
          as={ListIcon}
          boxSize={iconSize}
        />
      </MenuButton>
      {/* Portal: both the header and its left cell are overflow:hidden, which
          would otherwise clip the dropdown. */}
      <Portal>
        <MenuList zIndex={20}>
          {actionMenuItem(codeAction)}
          {actionMenuItem(settingsAction)}
          {actionMenuItem(embedFileAction)}
          {actionMenuItem(aiCopyAction)}
          <ButtonCopyExternalLink variant="menuitem" />
          {actionMenuItem(docsAction)}
          <ButtonShortenUrl variant="menuitem" />
          <ButtonSaveFrame variant="menuitem" />
        </MenuList>
      </Portal>
    </Menu>
  );

  const closeIcon = icon(XIcon, "close", () => setEdit(false));

  return (
    <HStack
      ref={containerRef}
      px={0}
      py={0}
      // flex-end (not space-between) so that when the icons no longer fit, the
      // overflow is clipped off the LEFT edge: the right hand side, ending in
      // the close button, always stays visible.
      justify={"flex-end"}
      alignItems={"center"}
      w={"100%"}
      maxWidth={"100%"}
      overflow={"hidden"}
      h={"40px"}
      bg={"var(--paper)"}
      borderBottom={"1px"}
      flexShrink={0}
    >
      {/* Grows to push the icons right when there is room, and is the first
          thing to be squeezed away when there is not. In the narrow layout it
          holds the overflow menu, flush against the left edge. */}
      <Box
        flex={"1 1 auto"}
        minW={0}
        overflow={"hidden"}
        h={"40px"}
        display={"flex"}
        alignItems={"center"}
        px={isNarrow ? 3 : 0}
      >
        {isNarrow ? (
          overflowMenu
        ) : (
          <Button
            mx={3}
            onClick={codeAction.onClick}
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
        )}
      </Box>
      <HStack
        borderLeft={isNarrow ? undefined : "1px"}
        right={0}
        px={3}
        bg={"var(--paper)"}
        justifyContent={"space-around"}
        alignItems={"center"}
        h={"40px"}
        w={"auto"}
        flexShrink={0}
      >
        {isNarrow ? null : (
          <>
            {actionIcon(settingsAction)}
            {actionIcon(embedFileAction)}
            {actionIcon(aiCopyAction)}
            <ButtonCopyExternalLink
              iconSize={iconSize}
              iconPadding={iconPadding}
            />
            {actionIcon(docsAction)}
            <ButtonShortenUrl iconSize={iconSize} iconPadding={iconPadding} />
            <ButtonSaveFrame iconSize={iconSize} iconPadding={iconPadding} />
          </>
        )}
        {closeIcon}
      </HStack>
    </HStack>
  );
};
