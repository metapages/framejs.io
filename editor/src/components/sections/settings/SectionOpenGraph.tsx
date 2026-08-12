import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Box,
  Button,
  Image,
  Input,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Textarea,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useHashParamJson } from "@metapages/hash-query/react-hooks";
import { uploadFile } from "/@/hooks/useFileUpload";

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  /** Rendered server-side as one <meta property="article:tag"> per entry. */
  tags?: string[];
}

/** Trimmed, non-empty, case-insensitively de-duplicated, order preserved. */
const normalizeTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const tag = entry.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
  }
  return result;
};

export const SectionOpenGraph: React.FC = () => {
  const [og, setOg] = useHashParamJson<OpenGraphData | undefined>("og");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for text fields to avoid cursor-jump on every keystroke.
  // The hash param update is debounced so the URL doesn't change mid-typing.
  const [localTitle, setLocalTitle] = useState(og?.title || "");
  const [localDescription, setLocalDescription] = useState(
    og?.description || "",
  );
  const image = og?.image;
  const tags = useMemo(() => normalizeTags(og?.tags), [og?.tags]);
  // Uncommitted text in the "add tag" field; committed on Enter/comma/blur.
  const [tagDraft, setTagDraft] = useState("");

  // Sync from hash → local only when not actively editing (i.e. external changes)
  const titleFocused = useRef(false);
  const descriptionFocused = useRef(false);

  useEffect(() => {
    if (!titleFocused.current) {
      setLocalTitle(og?.title || "");
    }
  }, [og?.title]);

  useEffect(() => {
    if (!descriptionFocused.current) {
      setLocalDescription(og?.description || "");
    }
  }, [og?.description]);

  const commitOg = useCallback(
    (patch: Partial<OpenGraphData>) => {
      const next: OpenGraphData = { ...og, ...patch };
      // Remove undefined/empty values
      if (!next.title) delete next.title;
      if (!next.description) delete next.description;
      if (!next.image) delete next.image;
      const nextTags = normalizeTags(next.tags);
      if (nextTags.length) next.tags = nextTags;
      else delete next.tags;
      // Set undefined (removes hash param) if empty object
      setOg(Object.keys(next).length === 0 ? undefined : next);
    },
    [og, setOg],
  );

  // Debounce hash param updates for text fields
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const debouncedCommitOg = useCallback(
    (patch: Partial<OpenGraphData>) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => commitOg(patch), 400);
    },
    [commitOg],
  );
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Tags commit immediately (no debounce): each one is a discrete action —
  // Enter, comma, or a click on the close button — not a keystroke stream.
  const commitTagDraft = useCallback(() => {
    const next = normalizeTags([...tags, ...tagDraft.split(",")]);
    setTagDraft("");
    // Nothing new (empty draft, or only duplicates) → leave the hash alone.
    if (next.length !== tags.length) commitOg({ tags: next });
  }, [commitOg, tagDraft, tags]);

  const removeTag = useCallback(
    (tag: string) => commitOg({ tags: tags.filter((t) => t !== tag) }),
    [commitOg, tags],
  );

  const onTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        commitTagDraft();
      } else if (e.key === "Backspace" && !tagDraft && tags.length) {
        e.preventDefault();
        removeTag(tags[tags.length - 1]);
      }
    },
    [commitTagDraft, removeTag, tagDraft, tags],
  );

  const [dragOver, setDragOver] = useState(false);

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setUploading(true);
      try {
        const result = await uploadFile(file);
        commitOg({ image: result.url });
      } catch (err) {
        console.error("OG image upload failed:", err);
      } finally {
        setUploading(false);
      }
    },
    [commitOg],
  );

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImageFile(file);
    },
    [handleImageFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleImageFile(file);
    },
    [handleImageFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  // Paste support: listen on the drop zone container
  const dropZoneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = dropZoneRef.current;
    if (!el) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleImageFile(file);
          return;
        }
      }
    };
    el.addEventListener("paste", onPaste);
    return () => el.removeEventListener("paste", onPaste);
  }, [handleImageFile]);

  const dropZoneStyle = useMemo(
    () => ({
      border: "2px dashed",
      borderColor: dragOver ? "blue.400" : "gray.300",
      bg: dragOver ? "blue.50" : "transparent",
      borderRadius: "md",
      p: 3,
      textAlign: "center" as const,
      cursor: "pointer",
      transition: "all 0.15s",
    }),
    [dragOver],
  );

  return (
    <VStack align="stretch" gap={3} py={3} px={4}>
      <Text fontSize="sm" fontWeight="bold">
        Open Graph
      </Text>

      <Box>
        <Text fontSize="xs" mb={1}>
          Title
        </Text>
        <Input
          size="sm"
          value={localTitle}
          onFocus={() => (titleFocused.current = true)}
          onBlur={() => {
            titleFocused.current = false;
            clearTimeout(debounceRef.current);
            commitOg({ title: localTitle });
          }}
          onChange={(e) => {
            setLocalTitle(e.target.value);
            debouncedCommitOg({ title: e.target.value });
          }}
          placeholder="Page title"
        />
      </Box>

      <Box>
        <Text fontSize="xs" mb={1}>
          Description
        </Text>
        <Textarea
          size="sm"
          value={localDescription}
          onFocus={() => (descriptionFocused.current = true)}
          onBlur={() => {
            descriptionFocused.current = false;
            clearTimeout(debounceRef.current);
            commitOg({ description: localDescription });
          }}
          onChange={(e) => {
            setLocalDescription(e.target.value);
            debouncedCommitOg({ description: e.target.value });
          }}
          placeholder="Page description"
          rows={3}
        />
      </Box>

      <Box>
        <Text fontSize="xs" mb={1}>
          Tags
        </Text>
        {tags.length > 0 && (
          <Wrap mb={2} spacing={1}>
            {tags.map((tag) => (
              <WrapItem key={tag}>
                <Tag size="sm" borderRadius="full" variant="subtle">
                  <TagLabel>{tag}</TagLabel>
                  <TagCloseButton
                    aria-label={`Remove tag ${tag}`}
                    onClick={() => removeTag(tag)}
                  />
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        )}
        <Input
          size="sm"
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={onTagKeyDown}
          onBlur={commitTagDraft}
          placeholder="Add a tag, then press Enter"
        />
      </Box>

      <Box>
        <Text fontSize="xs" mb={1}>
          Image
        </Text>
        {image ? (
          <Box position="relative">
            <Image
              src={image}
              alt="OG preview"
              maxH="120px"
              objectFit="contain"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            />
            <Button
              size="xs"
              variant="ghost"
              position="absolute"
              top={0}
              right={0}
              onClick={() => {
                commitOg({ image: undefined });
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Remove
            </Button>
          </Box>
        ) : (
          <Box
            ref={dropZoneRef}
            tabIndex={0}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            {...dropZoneStyle}
          >
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploading}
              display="none"
            />
            {uploading ? (
              <Text fontSize="xs" color="gray.500">
                Uploading...
              </Text>
            ) : (
              <Text fontSize="xs" color="gray.500">
                Drop image here, paste, or click to browse
              </Text>
            )}
          </Box>
        )}
      </Box>
    </VStack>
  );
};
