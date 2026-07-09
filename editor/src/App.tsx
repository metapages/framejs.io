import "/@/app.css";
import "/@/debug.css";
import React, { useCallback, useEffect, useRef } from "react";
import { useStore } from "/@/store";
import { useHandleFilesUploaded, uploadFile } from "/@/hooks/useFileUpload";
import { useShortUrlMode } from "/@/hooks/useShortUrlMode";

import { Box, useToast, VStack } from "@chakra-ui/react";

import { MainHeader } from "/@/components/header/MainHeader";
import { PanelCode } from "./components/sections/PanelCode";
import { PanelLlms } from "/@/components/sections/PanelLlms";
import { PanelSettings } from "./components/sections/PanelSettings";

export const App: React.FC = () => {
  useShortUrlMode();
  const shownPanel = useStore((state) => state.shownPanel);
  const setFileUploadTrigger = useStore((state) => state.setFileUploadTrigger);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const handleFilesUploaded = useHandleFilesUploaded();

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      try {
        const files = e.target.files;
        const uploaded = [];
        for (let i = 0; i < files.length; i++) {
          uploaded.push(await uploadFile(files[i]));
        }
        handleFilesUploaded(uploaded);
        toast({
          title: `Uploaded ${uploaded.length} file${uploaded.length > 1 ? "s" : ""}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast({
          title: "Upload failed",
          description: message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      e.target.value = "";
    },
    [handleFilesUploaded, toast],
  );

  useEffect(() => {
    setFileUploadTrigger(() => fileInputRef.current?.click());
    return () => setFileUploadTrigger(null);
  }, [setFileUploadTrigger]);

  let content = <PanelCode />;
  if (shownPanel === "settings") content = <PanelSettings />;
  if (shownPanel === "ai") content = <PanelLlms />;
  return (
    <VStack
      gap={0}
      w={"100%"}
      h="100vh"
      overflow={"hidden"}
      borderLeft={"1px"}
      borderTop={"1px"}
      borderRight={"1px"}
      borderBottom={"1px"}
    >
      <MainHeader />
      <Box flex={1} w="100%" overflow="hidden" position="relative">
        {content}
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
    </VStack>
  );
};
