"""Compatibility shim: `metaframe-widget` was renamed to `framejs`.

Importing this module emits a DeprecationWarning and re-exports everything from
`framejs`, so existing notebooks keep running unchanged. `MetaframeWidget` and
`Frame` are the same class object here as in `framejs` — not a subclass — so
`isinstance` checks and `pipe_to` work across both names.
"""

import warnings

from framejs import Frame, MetaframeWidget

__all__ = ["Frame", "MetaframeWidget"]

warnings.warn(
    "metaframe-widget has been renamed to framejs. Install `framejs` and use "
    "`from framejs import Frame`; this package only forwards to it and will "
    "receive no further updates.",
    DeprecationWarning,
    stacklevel=2,
)
