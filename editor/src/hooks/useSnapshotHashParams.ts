import { useCallback, useEffect, useState } from "react";

import { InputsHashParam } from "/@/components/sections/settings/SectionInputs";
import { useFrameSourceForPersist } from "/@/hooks/useFrameSource";
import { convertMetaframeInputs } from "/@/utils/convertInputs";
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
import { useMetaframe } from "@metapages/metapage-react/hooks";

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
  const metaframeBlob = useMetaframe();
  // The source is NOT in the url any more (see useFrameSource), so it has to be
  // injected into the hash this builds — serializing the hash alone would
  // snapshot a frame with no code.
  const source = useFrameSourceForPersist();
  const [metaframeInputs, setMetaframeInputs] = useState<
    InputsHashParam | undefined
  >(undefined);

  useEffect(() => {
    if (metaframeBlob.metaframe) {
      setMetaframeInputs(metaframeBlob.metaframe.getInputs());
      return metaframeBlob.metaframe.onInputs(() => {
        setMetaframeInputs(metaframeBlob.metaframe.getInputs());
      });
    }
  }, [metaframeBlob.metaframe]);

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

    // Merge metaframe inputs (received via onInputs) into hash params
    let newInputs = getHashParamValueJsonFromWindow<
      InputsHashParam | undefined
    >("inputs");
    if (metaframeInputs && Object.keys(metaframeInputs).length > 0) {
      newInputs = await convertMetaframeInputs(
        metaframeInputs,
        newInputs || undefined,
      );
    }
    // Inputs pointing at http://localhost:<port> are only reachable from the
    // machine that authored the frame. A snapshot is a shared, immutable
    // artifact, so copy that content into the remote file store and rewrite
    // the reference to the canonical /f/<sha256> URL. This must happen before
    // the hash string is built: the snapshot's sha256 is computed from it.
    newInputs = await uploadLocalUrlInputs(newInputs || undefined);

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
