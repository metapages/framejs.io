import React, { useCallback, useEffect, useState } from "react";

import { PanelHeader } from "/@/components/common/PanelHeader";
import { useFrameSource } from "/@/hooks/useFrameSource";

import {
  Box,
  Button,
  Code,
  HStack,
  Spinner,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Copy } from "@phosphor-icons/react";

const llmsCode = `// Your code here:
export const onInputs = (inputs) => {
  // Your implementation
};`;

export const PanelLlms: React.FC = () => {
  const [aiBaseContent, setAiBaseContent] = useState<string>("");
  const [code] = useFrameSource();
  const [fullAiText, setFullAiText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

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
        setAiBaseContent(text.replace(llmsCode, ""));
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
    setFullAiText(aiBaseContent + code);
  }, [code, aiBaseContent]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      if (!aiBaseContent) return;
      let text = aiBaseContent;
      text = text.replace(llmsCode, "");
      // From the store, not the url: `js` is not a hash param here any more.
      text += code ?? "";
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied AI guide to clipboard",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Failed to copy to clipboard",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [aiBaseContent, toast]);

  return (
    <Box
      position={"absolute"}
      borderLeft={"1px"}
      top={0}
      w={"100%"}
      h={"100%"}
      right={0}
      overflowY="scroll"
      bg={"gray.100"}
    >
      <PanelHeader title={"AI Guide"}>
        <Button
          leftIcon={<Copy size={16} />}
          size="sm"
          onClick={handleCopyToClipboard}
          isDisabled={isLoading || !!error || !fullAiText}
          variant="ghost"
          _hover={{ bg: "gray.200" }}
          borderRadius="md"
          px={3}
          py={5}
          h="auto"
          minH="auto"
          maxH="calc(100% - 20px)"
        >
          Copy (then paste into AI prompt)
        </Button>
      </PanelHeader>

      <Box p={6}>
        {isLoading && (
          <VStack spacing={4}>
            <Spinner size="lg" />
            <Text>Loading AI guide...</Text>
          </VStack>
        )}

        {error && (
          <Box
            p={4}
            bg="red.50"
            border="1px"
            borderColor="red.200"
            borderRadius="md"
          >
            <Text color="red.600" fontWeight="bold">
              Error loading content:
            </Text>
            <Text color="red.500">{error}</Text>
          </Box>
        )}

        {fullAiText && !isLoading && !error && (
          <Code
            display="block"
            whiteSpace="pre-wrap"
            p={4}
            bg="gray.50"
            borderRadius="md"
            fontSize="sm"
            lineHeight="1.6"
            overflowX="auto"
          >
            {fullAiText}
          </Code>
        )}
      </Box>
    </Box>
  );
};
