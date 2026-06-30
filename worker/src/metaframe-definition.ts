import { getHashParamValueJsonFromHashString } from "@metapages/hash-query";
import { MetaframeDefinition } from "@metapages/metapage";

export const DEFAULT_METAFRAME_DEFINITION: MetaframeDefinition = {
  metadata: {
    name: "Javascript code runner",
    tags: ["javascript", "code", "js"],
  },
  inputs: {},
  outputs: {},
  hashParams: {
    bgColor: {
      type: "string",
      description: "The background color of the metaframe",
      label: "Background Color",
    },
    definition: {
      type: "json",
      description: "The definition of the metaframe",
      label: "Definition",
    },
    edit: {
      type: "boolean",
      description: "Whether the metaframe is in edit mode",
      label: "Edit",
    },
    editorWidth: {
      type: "string",
      description:
        "The width of the editor, in valid CSS. If no units are provided, 'ch' is assumed.",
      label: "Editor Width",
    },
    hm: {
      type: "string",
      description:
        "The visibility of the menu button. 'disabled' to hide, 'invisible' to hide until hover, 'visible' to show always.",
      label: "Menu Button Visibility",
      allowed: [
        { value: "disabled" },
        { value: "invisible" },
        { value: "visible" },
      ],
    },
    inputs: {
      type: "json",
      description:
        "The inputs of the metaframe. This is a JSON object with the input name as the key and the value as a dataref object. Datarefs are objects with a 'type' property and a 'value' property. The 'type' property is a string that can be one of 'base64', 'utf8', 'json', 'url', or 'key'. The 'value' property is a string or object depending on the type.",
      label: "Inputs",
    },
    js: {
      type: "stringBase64",
      description:
        "The JavaScript code to run in the metaframe. This is a base64 encoded string of the JavaScript code. Encoding is btoa(encodeURIComponent(value)), decoding is the reverse.",
      label: "JavaScript Code",
    },
    modules: {
      type: "json",
      description:
        "The modules of the metaframe. This is a JSON array of strings, each string being a module or css URL. This is deprecated, use es6 imports in the javascript directly.",
      label: "Modules or CSS URLs",
    },
    og: {
      type: "json",
      description:
        "Open Graph metadata for the metaframe. A JSON object with optional 'title', 'description', and 'image' fields used for link previews.",
      label: "Open Graph",
    },
    options: {
      type: "json",
      description:
        "The options of the metaframe. This is a JSON object with the option name as the key and the value as a string or boolean. The options are used to configure the metaframe. The options are: 'debug', 'disableCache', 'disableDatarefs', 'disableSmartInputUnpacking'.",
      label: "Options",
      allowed: [
        { value: "debug" },
        { value: "disableCache" },
        { value: "disableDatarefs" },
        { value: "disableSmartInputUnpacking" },
      ],
    },
  },
  allow: "clipboard-write",
};

/**
 * Default values for canonical hash params. A param whose value equals its
 * default carries no information: it must NOT be persisted into computed/saved
 * URLs, and must be removed from any JSON representation or API response that
 * returns the hash params.
 */
export const DEFAULT_HASH_PARAM_VALUES: Record<string, unknown> = {
  editorWidth: "80ch",
};

/**
 * Returns a shallow copy of a decoded hash-param object with any param whose
 * value equals its registered default removed. Keeps explicit (non-default)
 * values untouched.
 */
export function stripDefaultHashParams<T extends Record<string, unknown>>(
  params: T,
): T {
  const result = { ...params };
  for (const [key, defaultValue] of Object.entries(DEFAULT_HASH_PARAM_VALUES)) {
    if (key in result && result[key] === defaultValue) {
      delete result[key];
    }
  }
  return result;
}

/**
 * Returns the union of the default allowed hash params and any hash params
 * declared in the user-provided metaframe definition. The definition's
 * hashParams field is either a string[] or an object keyed by param name.
 *
 * Mirrors editor/src/utils/hashParams.ts getAllowedHashParams.
 */
export const getAllowedHashParams = (
  definition?: MetaframeDefinition,
): Set<string> => {
  const defaultHashParams = DEFAULT_METAFRAME_DEFINITION.hashParams;
  const defaultKeys = defaultHashParams
    ? Array.isArray(defaultHashParams)
      ? defaultHashParams
      : Object.keys(defaultHashParams)
    : [];
  const allowed = new Set<string>(defaultKeys);
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

/**
 * Computes the effective metaframe definition by starting with the default
 * and merging in the "definition" from the hash params string.
 *
 * The hashParams field of the result is computed using getAllowedHashParams:
 * it includes all default hash params plus any declared in the definition.
 */
export function computeMetaframeDefinition(
  hashParams?: string | null,
): MetaframeDefinition {
  if (!hashParams) {
    return DEFAULT_METAFRAME_DEFINITION;
  }

  const definition: MetaframeDefinition | undefined =
    getHashParamValueJsonFromHashString(hashParams, "definition");
  if (!definition) {
    return DEFAULT_METAFRAME_DEFINITION;
  }

  // Build the merged hashParams object using getAllowedHashParams
  const allowedNames = getAllowedHashParams(definition);
  // deno-lint-ignore no-explicit-any
  const mergedHashParams: Record<string, any> = {};

  // Start with defaults
  const defaultHP = DEFAULT_METAFRAME_DEFINITION.hashParams;
  if (defaultHP && !Array.isArray(defaultHP)) {
    for (const key of Object.keys(defaultHP)) {
      if (allowedNames.has(key)) {
        mergedHashParams[key] = defaultHP[key];
      }
    }
  }

  // Overlay definition's hashParams (with metadata if object-shaped)
  const defHP = definition.hashParams;
  if (defHP && !Array.isArray(defHP)) {
    for (const key of Object.keys(defHP)) {
      if (allowedNames.has(key)) {
        mergedHashParams[key] = defHP[key];
      }
    }
  } else if (Array.isArray(defHP)) {
    // Array-shaped: add entries with minimal metadata for new params
    for (const name of defHP) {
      if (!mergedHashParams[name]) {
        mergedHashParams[name] = { type: "string" };
      }
    }
  }

  return {
    metadata: definition.metadata ?? DEFAULT_METAFRAME_DEFINITION.metadata,
    inputs: { ...DEFAULT_METAFRAME_DEFINITION.inputs, ...definition.inputs },
    outputs: { ...DEFAULT_METAFRAME_DEFINITION.outputs, ...definition.outputs },
    hashParams: mergedHashParams,
    allow: definition.allow ?? DEFAULT_METAFRAME_DEFINITION.allow,
  };
}
