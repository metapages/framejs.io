import React, { useState } from "react";

import { useSnapshotHashParams } from "/@/hooks/useSnapshotHashParams";
import { LocalInputUploadError } from "/@/utils/localInputs";

import {
  Box,
  Icon,
  Link,
  Tooltip,
  useClipboard,
  useToast,
} from "@chakra-ui/react";
import { UploadIcon } from "@phosphor-icons/react";

import { HeaderButtonProps, HeaderMenuItem } from "./types";

export const ButtonShortenUrl: React.FC<HeaderButtonProps> = ({
  iconSize = "28px",
  iconPadding = "3px",
  variant = "icon",
}) => {
  const [loading, setLoading] = useState(false);
  const [shortenedUrl, setShortenedUrl] = useState("");
  const { onCopy } = useClipboard(shortenedUrl);
  const toast = useToast();
  const snapshot = useSnapshotHashParams();

  const handleShorten = async () => {
    // With no code in the editor there's nothing to shorten/save. Surface a
    // gentle notice instead of the generic error toast.
    if (!snapshot.hasSource) {
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

      const hash = await snapshot.build();
      if (hash === null) return;

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
          { type: "framejs:shorturl", url: shortUrl },
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
      if (error instanceof LocalInputUploadError) {
        toast({
          title: "Local input could not be uploaded",
          description: `${error.url} (input "${error.key}") could not be fetched, so the snapshot was not created. Is the local server still running?`,
          status: "error",
          duration: 8000,
          isClosable: true,
        });
        return;
      }
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

  if (variant === "menuitem") {
    return (
      <HeaderMenuItem
        icon={UploadIcon}
        label={"Create expiring snapshot"}
        onClick={handleShorten}
        isDisabled={loading}
      />
    );
  }

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
