import {
  DataRef,
  InputsHashParam,
} from "/@/components/sections/settings/SectionInputs";
import { uploadBlob } from "/@/hooks/useFileUpload";
import { UploadedFileInfo } from "/@/utils/codeComments";

const LOG_PREFIX = "[localInputs]";

// Hostnames that only ever resolve on the machine that authored the frame.
const LOCAL_HOSTNAMES = new Set(["localhost", "0.0.0.0", "::1"]);

const isLocalHostname = (hostname: string): boolean => {
  // URL.hostname keeps the brackets on IPv6 literals: "[::1]"
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    LOCAL_HOSTNAMES.has(host) ||
    host.endsWith(".localhost") ||
    /^127\.\d+\.\d+\.\d+$/.test(host)
  );
};

/**
 * True if `value` is an http(s) URL that only this machine can reach.
 *
 * Same-origin URLs are never "local": in local development the app itself is
 * served from a *.localhost origin, and its own /f/<sha256> uploads are already
 * in the remote store.
 */
export const isLocalUrlValue = (
  value: unknown,
  pageOrigin: string,
): boolean => {
  if (typeof value !== "string") return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (pageOrigin && url.origin === pageOrigin) return false;
  return isLocalHostname(url.hostname);
};

/**
 * True if the DataRef's value is a URL to fetch. Mirrors the runtime's
 * `isDataRef` (worker/index.html): an untyped http(s) string is treated as a
 * url ref too, since several libraries leave `type` unset for urls.
 */
export const isUrlDataRef = (ref: DataRef | undefined): boolean => {
  if (!ref || typeof ref.value !== "string") return false;
  if (ref.type === "url") return true;
  return !ref.type && /^https?:\/\//.test(ref.value);
};

/** Thrown when a localhost input cannot be copied to the remote store. */
export class LocalInputUploadError extends Error {
  readonly key: string;
  readonly url: string;
  constructor(key: string, url: string, cause: unknown) {
    super(
      `Input "${key}" points at ${url}, which could not be fetched: ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
    );
    this.name = "LocalInputUploadError";
    this.key = key;
    this.url = url;
    (this as { cause?: unknown }).cause = cause;
  }
}

const filenameFromUrl = (url: string, fallback: string): string => {
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop();
    return last || fallback;
  } catch {
    return fallback;
  }
};

export type UploadLocalUrlInputsOptions = {
  /** Origin of the page doing the upload. Defaults to window.location.origin. */
  origin?: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
  /** Injectable for tests. */
  upload?: (name: string, blob: Blob) => Promise<UploadedFileInfo>;
};

/**
 * Copy every input whose DataRef points at a localhost URL into the remote file
 * store, returning inputs with those references rewritten to the canonical
 * `<origin>/f/<sha256>` URL. Inputs that are not local URLs are untouched, and
 * the original object is returned unchanged when there is nothing to do.
 *
 * Throws LocalInputUploadError if a local URL cannot be fetched or uploaded —
 * silently keeping the localhost URL would mint a snapshot that is broken for
 * everyone but the author.
 */
export const uploadLocalUrlInputs = async (
  inputs: InputsHashParam | undefined,
  options: UploadLocalUrlInputsOptions = {},
): Promise<InputsHashParam | undefined> => {
  if (!inputs) return inputs;

  const origin =
    options.origin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const fetchImpl = options.fetchImpl ?? fetch;
  const upload = options.upload ?? uploadBlob;

  const local = Object.entries(inputs).filter(
    ([, ref]) => isUrlDataRef(ref) && isLocalUrlValue(ref.value, origin),
  );
  if (local.length === 0) return inputs;

  console.log(
    `${LOG_PREFIX} page origin ${origin || "(unknown)"}: ${local.length} input(s) point at localhost, copying to the remote store`,
  );

  const uploaded = await Promise.all(
    local.map(async ([key, ref]) => {
      const url = ref.value as string;
      try {
        const response = await fetchImpl(url);
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        const contentType =
          response.headers.get("content-type") ||
          blob.type ||
          "application/octet-stream";
        const typedBlob =
          blob.type === contentType
            ? blob
            : new Blob([blob], { type: contentType });
        const info = await upload(filenameFromUrl(url, key), typedBlob);
        console.log(`${LOG_PREFIX} "${key}": ${url} → ${info.url}`);
        return [key, { type: "url", value: info.url } as DataRef] as const;
      } catch (err) {
        if (err instanceof LocalInputUploadError) throw err;
        throw new LocalInputUploadError(key, url, err);
      }
    }),
  );

  const result: InputsHashParam = { ...inputs };
  for (const [key, ref] of uploaded) {
    result[key] = ref;
  }
  return result;
};
