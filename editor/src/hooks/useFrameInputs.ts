import { useEffect, useState } from "react";

import { withoutReservedInputs } from "/@/utils/frameSource";

import { useMetaframe } from "@metapages/metapage-react/hooks";

/**
 * The frame's live metaframe inputs, kept current — WITHOUT the runtime's
 * reserved source input, which arrives in the same map but is the editor's,
 * not the frame's (see RESERVED_SOURCE_INPUT).
 */
export const useFrameInputs = (): Record<string, unknown> | undefined => {
  const metaframe = useMetaframe().metaframe;
  const [inputs, setInputs] = useState<Record<string, unknown> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!metaframe) return;
    const read = () => setInputs(withoutReservedInputs(metaframe.getInputs()));
    read();
    return metaframe.onInputs(read);
  }, [metaframe]);

  return inputs;
};
