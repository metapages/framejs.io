import React, { useCallback, useRef, useState } from "react";

import { injectUploadCommentIntoCode } from "/@/utils/codeComments";
import { useFrameSource } from "/@/hooks/useFrameSource";

import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Radio,
  RadioGroup,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useHashParamBase64 } from "@metapages/hash-query/react-hooks";
import { Plus, UploadSimple } from "@phosphor-icons/react";

export type DataRef = {
  type?: string;
  value: string | any;
};

export const AddInputButtonAndModal: React.FC<{
  add: (name: string, dataref: DataRef) => void;
  text?: string;
}> = ({ add, text }) => {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const toast = useToast();
  const [code, setCode] = useFrameSource();

  const [mode, setMode] = useState<"inline" | "url" | "file">("inline");
  const [name, setName] = useState("");
  const [inlineValue, setInlineValue] = useState("");
  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setMode("inline");
    setName("");
    setInlineValue("");
    setUrl("");
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
  }, []);

  const closeAndClear = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!name) return;

      if (mode === "inline") {
        if (!inlineValue) return;
        const trimmed = inlineValue.trim();
        let dataref: DataRef;
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            dataref = { type: "json", value: JSON.parse(trimmed) };
          } catch {
            dataref = { type: "inline", value: inlineValue };
          }
        } else {
          dataref = { type: "inline", value: inlineValue };
        }
        add(name, dataref);
        closeAndClear();
        return;
      }

      if (mode === "url") {
        if (!url) return;
        add(name, { type: "url", value: url });
        closeAndClear();
        return;
      }

      // File upload mode
      if (!selectedFile) return;

      setIsUploading(true);
      setUploadProgress(10);

      try {
        // Compute SHA256 hash of file content
        const fileBuffer = await selectedFile.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);
        const sha256 = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        setUploadProgress(20);

        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: selectedFile.name,
            contentType: selectedFile.type || "application/octet-stream",
            fileSize: selectedFile.size,
            sha256,
          }),
        });

        if (!presignRes.ok) {
          const err = await presignRes
            .json()
            .catch(() => ({ error: presignRes.statusText }));
          throw new Error(err.error || `Presign failed: ${presignRes.status}`);
        }

        setUploadProgress(40);
        const { presignedUrl, canonicalPath } = await presignRes.json();

        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": selectedFile.type || "application/octet-stream",
          },
          body: selectedFile,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed: ${uploadRes.status}`);
        }

        setUploadProgress(100);
        const canonicalUrl = `${window.location.origin}${canonicalPath}`;
        add(name, { type: "url", value: canonicalUrl });

        // Inject code comments so the user/LLM knows how to access the file
        const contentType = selectedFile.type || "application/octet-stream";
        const newCode = injectUploadCommentIntoCode(
          [{ name, url: canonicalUrl, contentType }],
          code,
        );
        setCode(newCode);

        toast({
          title: `Uploaded ${selectedFile.name}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        closeAndClear();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast({
          title: "Upload failed",
          description: message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [
      name,
      inlineValue,
      url,
      mode,
      selectedFile,
      add,
      closeAndClear,
      toast,
      code,
      setCode,
    ],
  );

  const canSubmit =
    name &&
    (mode === "inline" ? inlineValue : mode === "url" ? url : selectedFile) &&
    !isUploading;

  return (
    <>
      <Button
        variant="ghost"
        leftIcon={<Icon as={Plus} boxSize={6} />}
        onClick={onToggle}
        aria-label="add input"
      >
        {text || "Add Input"}
      </Button>

      <Modal isOpen={isOpen} onClose={closeAndClear}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text>Add Initial Input:</Text>
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel htmlFor="name">Input Name</FormLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., data, config"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Source</FormLabel>
                  <RadioGroup
                    value={mode}
                    onChange={(v) => setMode(v as "inline" | "url" | "file")}
                  >
                    <HStack spacing={4}>
                      <Radio value="inline">Inline Value</Radio>
                      <Radio value="url">URL</Radio>
                      <Radio value="file">File Upload</Radio>
                    </HStack>
                  </RadioGroup>
                </FormControl>

                {mode === "inline" ? (
                  <FormControl>
                    <FormLabel htmlFor="inlineValue">Value</FormLabel>
                    <Textarea
                      id="inlineValue"
                      placeholder={
                        'e.g. hello  or  {"key": "value"}  or  [1,2,3]'
                      }
                      value={inlineValue}
                      onChange={(e) => setInlineValue(e.target.value)}
                      rows={3}
                    />
                  </FormControl>
                ) : mode === "url" ? (
                  <FormControl>
                    <FormLabel htmlFor="url">URL</FormLabel>
                    <Input
                      id="url"
                      type="text"
                      placeholder="https://example.com/data.json"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </FormControl>
                ) : (
                  <FormControl>
                    <FormLabel>File</FormLabel>
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                        if (file && !name) {
                          setName(file.name);
                        }
                      }}
                    />
                    <HStack>
                      <Button
                        size="sm"
                        leftIcon={<Icon as={UploadSimple} />}
                        onClick={() => fileInputRef.current?.click()}
                        isDisabled={isUploading}
                      >
                        Choose File
                      </Button>
                      <Text fontSize="sm" color="gray.600" noOfLines={1}>
                        {selectedFile ? selectedFile.name : "No file selected"}
                      </Text>
                    </HStack>
                    {isUploading && (
                      <Progress
                        mt={2}
                        value={uploadProgress}
                        size="sm"
                        colorScheme="blue"
                        borderRadius="md"
                        hasStripe
                        isAnimated
                      />
                    )}
                  </FormControl>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button
                type="submit"
                colorScheme="blackAlpha"
                mr={3}
                isDisabled={!canSubmit}
                isLoading={isUploading}
                loadingText="Uploading"
              >
                Add
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};
