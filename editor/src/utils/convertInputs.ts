import { InputsHashParam } from "/@/components/sections/settings/SectionInputs";
import { DataRef } from "/@/components/sections/settings/SectionInputs";
import { uploadString, uploadJson, uploadBlob } from "/@/hooks/useFileUpload";
import { urlDataUrlToUrl } from "/@/utils/urlDataRef";

// const UPLOAD_SIZE_THRESHOLD = 10_000; // 10KB
const UPLOAD_SIZE_THRESHOLD = 200;

const LOG_PREFIX = "[convertInputs]";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function encodeBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binString = "";
  const size = bytes.length;
  for (let i = 0; i < size; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString);
}

/**
 * Convert a single metaframe input value to a DataRef, uploading to S3
 * if the serialized size exceeds the threshold.
 */
export async function convertInputValue(
  key: string,
  value: unknown,
): Promise<DataRef> {
  if (typeof value === "string") {
    // A v2 url dataref (data:text/x-uri,<encoded url>) is a reference, not
    // text: keep it as a url ref so the runtime fetches it, instead of storing
    // the literal data URL string as utf8.
    const urlFromDataRef = urlDataUrlToUrl(value);
    if (urlFromDataRef) {
      console.log(
        `${LOG_PREFIX} "${key}": text/x-uri dataref → url ${urlFromDataRef}`,
      );
      return { type: "url", value: urlFromDataRef };
    }
    if (value.length > UPLOAD_SIZE_THRESHOLD) {
      console.log(
        `${LOG_PREFIX} "${key}": string ${formatSize(value.length)} exceeds threshold, uploading to S3`,
      );
      try {
        const info = await uploadString(key, value);
        console.log(`${LOG_PREFIX} "${key}": uploaded → ${info.url}`);
        return { type: "url", value: info.url };
      } catch (e) {
        console.warn(
          `${LOG_PREFIX} "${key}": upload failed, falling back to inline utf8:`,
          e,
        );
      }
    } else {
      console.log(
        `${LOG_PREFIX} "${key}": string ${formatSize(value.length)} → inline utf8`,
      );
    }
    return { type: "utf8", value };
  }

  if (typeof value === "object" && value instanceof Blob) {
    // Base64 increases size by ~33%, estimate without encoding first
    const estimatedBase64Size = Math.ceil((value.size * 4) / 3);
    if (estimatedBase64Size > UPLOAD_SIZE_THRESHOLD) {
      console.log(
        `${LOG_PREFIX} "${key}": blob ${formatSize(value.size)} (type=${value.type || "unknown"}) exceeds threshold, uploading to S3`,
      );
      try {
        const info = await uploadBlob(key, value);
        console.log(`${LOG_PREFIX} "${key}": uploaded → ${info.url}`);
        return { type: "url", value: info.url };
      } catch (e) {
        console.warn(
          `${LOG_PREFIX} "${key}": upload failed, falling back to inline base64:`,
          e,
        );
      }
    } else {
      console.log(
        `${LOG_PREFIX} "${key}": blob ${formatSize(value.size)} → inline base64`,
      );
    }
    const blobString = await encodeBase64(value);
    return { type: "base64", value: blobString };
  }

  if (typeof value === "object") {
    const jsonString = JSON.stringify(value);
    if (jsonString.length > UPLOAD_SIZE_THRESHOLD) {
      console.log(
        `${LOG_PREFIX} "${key}": json ${formatSize(jsonString.length)} exceeds threshold, uploading to S3`,
      );
      try {
        const info = await uploadJson(key, value);
        console.log(`${LOG_PREFIX} "${key}": uploaded → ${info.url}`);
        return { type: "url", value: info.url };
      } catch (e) {
        console.warn(
          `${LOG_PREFIX} "${key}": upload failed, falling back to inline json:`,
          e,
        );
      }
    } else {
      console.log(
        `${LOG_PREFIX} "${key}": json ${formatSize(jsonString.length)} → inline json`,
      );
    }
    return { type: "json", value };
  }

  console.log(`${LOG_PREFIX} "${key}": ${typeof value} → inline json`);
  return { type: "json", value };
}

/**
 * Convert all metaframe inputs to DataRefs, uploading large values to S3.
 * Merges results into `existingInputs` if provided.
 */
export async function convertMetaframeInputs(
  metaframeInputs: Record<string, unknown>,
  existingInputs?: InputsHashParam,
): Promise<InputsHashParam> {
  const result: InputsHashParam = { ...existingInputs };
  const entries = Object.entries(metaframeInputs);

  console.log(
    `${LOG_PREFIX} Converting ${entries.length} input(s), threshold=${formatSize(UPLOAD_SIZE_THRESHOLD)}`,
  );

  const converted = await Promise.all(
    entries.map(([key, value]) => convertInputValue(key, value)),
  );

  for (let i = 0; i < entries.length; i++) {
    result[entries[i][0]] = converted[i];
  }

  const uploaded = converted.filter((d) => d.type === "url").length;
  const inlined = converted.length - uploaded;
  console.log(
    `${LOG_PREFIX} Done: ${uploaded} uploaded to S3, ${inlined} inlined`,
  );

  return result;
}
