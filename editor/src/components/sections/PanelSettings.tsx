import { PanelHeader } from "/@/components/common/PanelHeader";

import {
  Box,
  Divider,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
} from "@chakra-ui/react";

import { CacheManagement } from "./settings/CacheManagement";
import { EditBgColor } from "./settings/EditBgColor";
import { EditButtonSettings } from "./settings/EditButtonSettings";
import { EditColorScheme } from "./settings/EditColorScheme";
import { EditDebugMode } from "./settings/EditDebugMode";
import { EditDisableCache } from "./settings/EditDisableCache";
import { EditDisableDatarefs } from "./settings/EditDisableDatarefs";
import { EditDisableSmartInputUnpacking } from "./settings/EditDisableSmartInputUnpacking";
import { EditEditorWidth } from "./settings/EditEditorWidth";
import { SectionHashParams } from "./settings/SectionHashParams";
import { SectionInputs } from "./settings/SectionInputs";
import { SectionIO } from "./settings/SectionIO";
import { SectionModules } from "./settings/SectionModules";
import { SectionOpenGraph } from "./settings/SectionOpenGraph";

export const PanelSettings: React.FC = () => {
  return (
    <Box
      position={"absolute"}
      borderLeft={"1px"}
      top={0}
      w={"100%"}
      h={"100%"}
      right={0}
      bg={"gray.100"}
    >
      <Flex direction="column" h="100%">
        <PanelHeader title={"settings"} />
        <Tabs
          display="flex"
          flexDirection="column"
          flex={1}
          minH={0}
          variant="unstyled"
          size="sm"
        >
          <TabList pl="6px">
            {["Runtime", "Appearance", "Open Graph", "Advanced"].map(
              (label) => (
                <Tab
                  key={label}
                  fontSize="xs"
                  py={1.5}
                  px="12px"
                  bg="var(--surface-2)"
                  color="gray.500"
                  _selected={{
                    color: "gray.800",
                    bg: "#F7F7F7",
                  }}
                >
                  {label}
                </Tab>
              ),
            )}
          </TabList>
          <TabPanels flex={1} minH={0} overflowY="auto">
            <TabPanel p={0}>
              <VStack gap={3} py={3}>
                <SectionModules />
                <Divider borderColor="var(--line)" />
                <SectionInputs />
                <Divider borderColor="var(--line)" />
                <SectionHashParams />
              </VStack>
            </TabPanel>
            <TabPanel p={0}>
              <VStack gap={3} py={3}>
                <EditButtonSettings />
                <Divider borderColor="var(--line)" />
                <EditColorScheme />
                <Divider borderColor="var(--line)" />
                <EditBgColor />
                <Divider borderColor="var(--line)" />
                <EditEditorWidth />
              </VStack>
            </TabPanel>
            <TabPanel p={0}>
              <SectionOpenGraph />
            </TabPanel>
            <TabPanel p={0}>
              <VStack gap={3} py={3}>
                <SectionIO />
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
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    </Box>
  );
};
