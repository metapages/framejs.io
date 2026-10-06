import { useCallback } from "react";
import {
  useHashParamBase64,
  useHashParamJson,
} from "@metapages/hash-query/react-hooks";
import {
  UploadedFileInfo,
  injectUploadCommentIntoCode,
} from "/@/utils/codeComments";
import { InputsHashParam } from "/@/components/sections/settings/SectionInputs";
import { useFrameSource } from "/@/hooks/useFrameSource";

export async function uploadString(
  name: string,
  s: string,
): Promise<UploadedFileInfo> {
  // Convert string `s` into a File object for upload
  const file = new File([s], name, { type: "text/plain;charset=UTF-8" });
  return await uploadFile(file);
}

export async function uploadJson(
  name: string,
  json: any,
): Promise<UploadedFileInfo> {
  // Convert JSON `json` into a File object for upload
  const jsonString = JSON.stringify(json);
  const file = new File([jsonString], name, {
    type: "application/json;charset=UTF-8",
  });
  return await uploadFile(file);
}

export async function uploadBlob(
  name: string,
  blob: Blob,
): Promise<UploadedFileInfo> {
  const file = new File([blob], name, {
    type: blob.type || "application/octet-stream",
  });
  return await uploadFile(file);
}

async function uploadFile(file: File): Promise<UploadedFileInfo> {
  // Compute SHA256 hash of file content
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const sha256 = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const canonicalPath = `/f/${sha256}`;
  const url = `${window.location.origin}${canonicalPath}`;

  // Check if the file already exists (HEAD follows the redirect to S3)
  try {
    const headRes = await fetch(url, { method: "HEAD" });
    if (headRes.ok) {
      return {
        name: file.name,
        url,
        contentType: file.type || "application/octet-stream",
      };
    }
  } catch {
    // ignore — fall through to upload
  }

  // Get presigned URL
  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentType: file.type || "application/octet-stream",
      fileSize: file.size,
      sha256,
    }),
  });

  if (!presignRes.ok) {
    const err = await presignRes
      .json()
      .catch(() => ({ error: presignRes.statusText }));
    throw new Error(err.error || `Presign failed: ${presignRes.status}`);
  }

  const { presignedUrl } = await presignRes.json();

  // Upload directly to S3 via presigned URL
  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed for ${file.name}: ${uploadRes.status}`);
  }

  return {
    name: file.name,
    url,
    contentType: file.type || "application/octet-stream",
  };
}

export function useHandleFilesUploaded() {
  const [code, setCode] = useFrameSource();
  const [hashInputs, setHashInputs] = useHashParamJson<
    InputsHashParam | undefined
  >("inputs");

  const handleFilesUploaded = useCallback(
    (files: UploadedFileInfo[]) => {
      const newInputs: InputsHashParam = { ...hashInputs };
      for (const file of files) {
        newInputs[file.name] = { type: "url", value: file.url };
      }
      setHashInputs(newInputs);

      const newCode = injectUploadCommentIntoCode(files, code);
      setCode(newCode);
    },
    [hashInputs, setHashInputs, code, setCode],
  );

  return handleFilesUploaded;
}

export { uploadFile };
export type { UploadedFileInfo };
