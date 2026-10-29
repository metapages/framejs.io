import React, { useState } from "react";

import { useSnapshotHashParams } from "/@/hooks/useSnapshotHashParams";
import { LocalInputUploadError } from "/@/utils/localInputs";

import { Box, Icon, Link, Tooltip, useToast } from "@chakra-ui/react";
import { FileHtmlIcon } from "@phosphor-icons/react";

import { HeaderButtonProps, HeaderMenuItem } from "./types";

const LABEL = "Export standalone HTML";

// Start a download of a same-origin URL without navigating away. The worker
// sends it with Content-Disposition: attachment.
const download = (url: string) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// "Export standalone HTML": the server bakes the frame — runtime, code, every
// module and input — into one .html file that runs with no network, stores it
// under the sha256 of the file, and this downloads it. See
// worker/src/standalone-export.ts.
export const ButtonExportHtml: React.FC<HeaderButtonProps> = ({
  iconSize = "28px",
  iconPadding = "3px",
  variant = "icon",
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const snapshot = useSnapshotHashParams();

  const handleExport = async () => {
    if (loading) return;
    if (!snapshot.hasSource) {
      toast({
        title: "Empty: nothing to export",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const progress = toast({
      title: "Exporting standalone HTML…",
      description: "Bundling the code, modules and inputs into one file.",
      status: "loading",
      duration: null,
    });
    try {
      setLoading(true);
      const hashParams = await snapshot.build();
      if (hashParams === null) return;

      const response = await fetch("/api/export/html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashParams }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const url = `${window.location.origin}${data.path}`;
      download(url);
      toast({
        title: `Standalone HTML exported (${formatSize(data.size)})`,
        description: (
          <Link href={url} fontSize="sm" isExternal>
            {url}
          </Link>
        ),
        status: "success",
        duration: 8000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Export HTML error:", error);
      toast({
        title: "Export failed",
        description:
          error instanceof LocalInputUploadError
            ? `${error.url} (input "${error.key}") could not be fetched. Is the local server still running?`
            : error instanceof Error
              ? error.message
              : String(error),
        status: "error",
        duration: 8000,
        isClosable: true,
      });
    } finally {
      toast.close(progress);
      setLoading(false);
    }
  };

  if (variant === "menuitem") {
    return (
      <HeaderMenuItem
        icon={FileHtmlIcon}
        label={LABEL}
        onClick={handleExport}
        isDisabled={loading}
        testId="export-html-button"
      />
    );
  }

  return (
    <Tooltip label={LABEL}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        h="40px"
        onClick={handleExport}
        cursor={loading ? "progress" : "pointer"}
        data-testid="export-html-button"
      >
        <Icon
          aria-label={LABEL.toLowerCase()}
          _hover={{ bg: "gray.300" }}
          bg={"none"}
          p={iconPadding}
          borderRadius={5}
          as={FileHtmlIcon}
          boxSize={iconSize}
          opacity={loading ? 0.5 : 1}
        />
      </Box>
    </Tooltip>
  );
};
