/**
 * v2 datarefs (@metapages/dataref) encode a *reference* to bytes as a data URL
 * with the `text/x-uri` mime type:
 *
 *   data:text/x-uri;charset=utf-8,https%3A%2F%2Fexample.com%2Fbig.bin
 *
 * The payload is the URL-encoded URL of the real bytes, not the bytes
 * themselves. Anything that treats such a value as plain text ends up storing
 * (and later handing to user code) the literal "data:text/x-uri;..." string.
 */
const URI_MIME_TYPE = "text/x-uri";

/**
 * The URL carried by a `text/x-uri` data URL, or undefined if `value` is not
 * one. Other data URLs (data:image/png;base64,... and friends) are useful as
 * they are and are deliberately left alone.
 */
export const urlDataUrlToUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !value.startsWith("data:")) return undefined;
  const commaIndex = value.indexOf(",");
  if (commaIndex === -1) return undefined;
  const mimeType = value.substring("data:".length, commaIndex).split(";")[0];
  if (mimeType !== URI_MIME_TYPE) return undefined;
  return decodeURIComponent(value.substring(commaIndex + 1));
};
