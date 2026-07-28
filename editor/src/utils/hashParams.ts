import {
  deleteHashParamFromUrl,
  getUrlHashParams,
} from "@metapages/hash-query/react-hooks";
import { MetaframeDefinition } from "@metapages/metapage";

// The default allowed hash parameters, matching the hashParams declared
// in the worker's metaframe.json (DEFAULT_METAFRAME_DEFINITION).
//
// `checklist` is allowed here but is deliberately absent from that definition:
// it holds user-mutable runtime state a frame writes to the URL (e.g. an
// interactive checklist). Being allowed keeps the editor from stripping it on
// copy / shorten / save; being outside the definition keeps the worker from
// baking it into a /j/ short URL, so it stays live in the URL — where, like
// any param on the URL, it overrides what the short URL stored.
export const DEFAULT_ALLOWED_HASH_PARAMS: readonly string[] = [
  "bgColor",
  "checklist",
  "definition",
  "edit",
  "editorWidth",
  "hm",
  "inputs",
  "js",
  "modules",
  "og",
  "options",
];

// Returns the union of the default allowed hash params and any hash params
// declared in the user-provided metaframe definition (the `definition` hash
// param, which lets the user whitelist their own). The definition's
// hashParams field is either a string[] or an object keyed by param name.
export const getAllowedHashParams = (
  definition?: MetaframeDefinition,
): Set<string> => {
  const allowed = new Set<string>(DEFAULT_ALLOWED_HASH_PARAMS);
  const hashParams = definition?.hashParams;
  if (hashParams) {
    if (Array.isArray(hashParams)) {
      hashParams.forEach((name) => allowed.add(name));
    } else {
      Object.keys(hashParams).forEach((name) => allowed.add(name));
    }
  }
  return allowed;
};

// Returns the URL with any hash params not in the allowed set removed.
export const stripDisallowedHashParams = (
  url: string,
  allowedKeys: Set<string>,
): string => {
  if (!url) return url;
  const [, params] = getUrlHashParams(url);
  let resultUrl: string | URL = url;
  for (const key of Object.keys(params)) {
    if (!allowedKeys.has(key)) {
      resultUrl = deleteHashParamFromUrl(resultUrl, key);
    }
  }
  return typeof resultUrl === "string" ? resultUrl : resultUrl.href;
};
