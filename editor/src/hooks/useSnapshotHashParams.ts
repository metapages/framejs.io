import { useCallback } from "react";

import { InputsHashParam } from "/@/components/sections/settings/SectionInputs";
import { useFrameSourceForPersist } from "/@/hooks/useFrameSource";
import { useFrameInputs } from "/@/hooks/useFrameInputs";
import { buildInputsHashParam } from "/@/utils/convertInputs";
import {
  getAllowedHashParams,
  stripDisallowedHashParamsFromHashString,
} from "/@/utils/hashParams";
import { uploadLocalUrlInputs } from "/@/utils/localInputs";

import { stringToBase64String } from "@metapages/hash-query";
import {
  getHashParamValueJsonFromWindow,
  setHashParamValueInHashString,
  setHashParamValueJsonInHashString,
} from "@metapages/hash-query/react-hooks";
import { MetaframeDefinition } from "@metapages/metapage";

/**
 * The frame as an immutable snapshot: the hash-param string sent to the
 * worker by "Create expiring snapshot" (/api/shorten) and "Export standalone
 * HTML" (/api/export/html). Both must capture exactly the same frame.
 *
 * `build()` resolves to null when there is no code (nothing to snapshot), and
 * throws LocalInputUploadError when a localhost input cannot be uploaded.
 */
export const useSnapshotHashParams = (): {
  hasSource: boolean;
  build: () => Promise<string | null>;
} => {
  // The source is NOT in the url any more (see useFrameSource), so it has to be
  // injected into the hash this builds — serializing the hash alone would
  // snapshot a frame with no code.
  const source = useFrameSourceForPersist();
  const metaframeInputs = useFrameInputs();

  const build = useCallback(async (): Promise<string | null> => {
    if (source === null) return null;

    // Get current hash params and remove "edit" and "hm" (the edit-button
    // visibility setting) so a snapshot never forces the edit button to stay
    // visible.
    let hash = window.location.hash.slice(1); // Remove leading "#"
    hash = setHashParamValueInHashString(hash, "edit", undefined);
    hash = setHashParamValueInHashString(hash, "hm", undefined);
    // Put the source back: it lives in the store, not the url.
    hash = setHashParamValueInHashString(
      hash,
      "js",
      stringToBase64String(source),
    );

    // Merge metaframe inputs (received via onInputs) into hash params.
    // Inputs pointing at http://localhost:<port> are only reachable from the
    // machine that authored the frame. A snapshot is a shared, immutable
    // artifact, so copy that content into the remote file store and rewrite
    // the reference to the canonical /f/<sha256> URL. This must happen before
    // the hash string is built: the snapshot's sha256 is computed from it.
    const newInputs = await uploadLocalUrlInputs(
      await buildInputsHashParam(
        getHashParamValueJsonFromWindow<InputsHashParam | undefined>("inputs"),
        metaframeInputs,
      ),
    );

    if (newInputs && Object.keys(newInputs).length > 0) {
      hash = setHashParamValueJsonInHashString(hash, "inputs", newInputs);
    }

    // Strip any hash params not in the metaframe.json defaults or the
    // user's `definition` whitelist (same logic as ButtonCopyExternalLink).
    const definition = getHashParamValueJsonFromWindow<
      MetaframeDefinition | undefined
    >("definition");
    const allowed = getAllowedHashParams(definition);

    return stripDisallowedHashParamsFromHashString(hash, allowed);
  }, [source, metaframeInputs]);

  return { hasSource: source !== null, build };
};
