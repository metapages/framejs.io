import React from "react";

import { Divider, VStack } from "@chakra-ui/react";

import { CacheManagement } from "./CacheManagement";
import { EditBgColor } from "./EditBgColor";
import { EditButtonSettings } from "./EditButtonSettings";
import { EditColorScheme } from "./EditColorScheme";
import { EditDebugMode } from "./EditDebugMode";
import { EditDisableCache } from "./EditDisableCache";
import { EditDisableDatarefs } from "./EditDisableDatarefs";
import { EditDisableSmartInputUnpacking } from "./EditDisableSmartInputUnpacking";
import { EditEditorWidth } from "./EditEditorWidth";

export const SectionOptions: React.FC = () => {
  return (
    <VStack
      w={"100%"}
      // p={6}
      gap={5}
      justifyContent="flex-start"
      alignItems="stretch"
    >
      <EditButtonSettings />
      <Divider borderColor="var(--line)" />
      <EditColorScheme />
      <Divider borderColor="var(--line)" />
      <EditBgColor />
      <Divider borderColor="var(--line)" />
      <EditEditorWidth />
      <Divider borderColor="var(--line)" />
      <EditDisableDatarefs />
      <Divider borderColor="var(--line)" />
      <EditDisableSmartInputUnpacking />
      <Divider borderColor="var(--line)" />
      <EditDisableCache />
      <Divider borderColor="var(--line)" />
      <EditDebugMode />
      <Divider borderColor="var(--line)" />
      <CacheManagement />
    </VStack>
  );
};
