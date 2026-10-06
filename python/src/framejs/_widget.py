import urllib.parse

import anywidget
import traitlets

from ._esm import ESM

#: Hosts serving the framejs *account* layer. Their /j/<id> URLs are the ones
#: people copy and share, but they are not what a notebook should load.
_APP_HOSTS = frozenset({"framejs.app", "www.framejs.app"})
#: The host serving the frame *runtime*.
_RUNTIME_HOST = "framejs.io"


def runtime_url(url: str) -> str:
    """Map a shareable ``framejs.app`` frame URL onto the ``framejs.io`` runtime.

    ``framejs.app/j/<id>`` and ``framejs.io/j/<id>`` are the same frame, but only
    framejs.io serves it as an embeddable metaframe with permissive CORS. The
    framejs.app URL answers a framed request with a branded wrapper page, and its
    ``/j/<id>/metaframe.json`` — which the metapage client fetches before it
    renders anything — carries no ``Access-Control-Allow-Origin``. A notebook on
    ``http://localhost:8888`` therefore gets::

        Access to fetch at 'https://framejs.app/j/<id>/metaframe.json' from origin
        'http://localhost:8888' has been blocked by CORS policy

    and no widget. Normalising here means a user can paste either URL — the one
    the share panel gives them is the framejs.app one — and it just works.

    Anything that is not a framejs.app ``/j/`` URL is returned unchanged, so
    full ``#?js=`` URLs, framejs.io URLs and local dev stacks are untouched.
    Query and fragment are preserved (``?v=<sha256>`` pins a published version,
    ``#?inputs=`` feeds the frame).
    """
    if not url:
        return url
    try:
        parts = urllib.parse.urlsplit(url)
    except ValueError:  # malformed; hand it back and let the browser complain
        return url
    host = (parts.hostname or "").lower()
    if host not in _APP_HOSTS:
        return url
    if parts.path != "/j" and not parts.path.startswith("/j/"):
        return url
    return urllib.parse.urlunsplit(parts._replace(netloc=_RUNTIME_HOST))


class Frame(anywidget.AnyWidget):
    """Widget that renders a framejs frame in an iframe (Jupyter and marimo).

    Args:
        url: Full frame URL (including hash params).
        inputs: Dict of inputs to push to the frame.
        outputs: Dict of outputs received from the frame (read-only).
        width: CSS width for the widget container (default "100%").
        height: CSS height for the widget container (default "400px").
        allow: iframe allow attribute string (e.g. "camera; microphone").
        saved_url: Latest expiring snapshot URL (/j/<sha256>) minted by the
            "Create expiring snapshot" button inside the widget (read-only).
            Handy for a quick capture; for anything you want to keep, Save a
            durable /j/<uuid> frame and use that URL instead.
    """

    _esm = ESM

    url = traitlets.Unicode("").tag(sync=True)
    inputs = traitlets.Dict({}).tag(sync=True)
    outputs = traitlets.Dict({}).tag(sync=True)
    width = traitlets.Unicode("100%").tag(sync=True)
    height = traitlets.Unicode("400px").tag(sync=True)
    allow = traitlets.Unicode("").tag(sync=True)
    # The URL the iframe ACTUALLY loads: `url` mapped through runtime_url().
    # Kept as its own synced trait rather than rewriting `url`, so reading back
    # `w.url` returns exactly what the caller passed. The ESM uses this for both
    # the iframe src and the postMessage origin check -- those two must agree or
    # snapshot URLs from the embedded editor are silently discarded.
    _runtime_url = traitlets.Unicode("").tag(sync=True)
    # Set by the ESM when the user clicks "Create expiring snapshot" inside the
    # embedded editor. Read-only from Python's perspective; updating it does not
    # reload the iframe (so editing is not interrupted).
    saved_url = traitlets.Unicode("").tag(sync=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Sync layout.height/width so ipywidgets' LayoutView doesn't clear
        # the styles that the ESM sets on the element.
        self.layout.height = self.height
        self.layout.width = self.width
        self.observe(self._sync_layout_height, names=["height"])
        self.observe(self._sync_layout_width, names=["width"])
        self._runtime_url = runtime_url(self.url)
        self.observe(self._sync_runtime_url, names=["url"])

    def _sync_runtime_url(self, change):
        self._runtime_url = runtime_url(change["new"])

    def _sync_layout_height(self, change):
        self.layout.height = change["new"]

    def _sync_layout_width(self, change):
        self.layout.width = change["new"]

    def set_inputs(self, d: dict):
        """Merge a dict into the current inputs."""
        self.inputs = {**self.inputs, **d}

    def set_input(self, key: str, value):
        """Set a single input key."""
        self.inputs = {**self.inputs, key: value}

    def on_outputs_change(self, callback):
        """Register a callback for when outputs change.

        The callback receives a change dict with 'old' and 'new' keys.
        """
        self.observe(callback, names=["outputs"])

    def on_saved_url_change(self, callback):
        """Register a callback for when the user creates an expiring snapshot.

        Fires after the user clicks "Create expiring snapshot" inside the
        embedded editor. The callback receives a change dict whose 'new' key
        holds the freshly-minted /j/<sha256> snapshot URL.
        """
        self.observe(callback, names=["saved_url"])

    def pipe_to(self, target: "Frame", output_key: str, input_key: str = None):
        """Connect an output of this widget to an input of another.

        When this widget's output_key changes, push the value to
        target's input_key (defaults to output_key if not specified).
        """
        if input_key is None:
            input_key = output_key

        def _forward(change):
            new_outputs = change.get("new", {})
            if output_key in new_outputs:
                target.set_input(input_key, new_outputs[output_key])

        self.observe(_forward, names=["outputs"])


#: Deprecated alias. The class was called ``MetaframeWidget`` while the package
#: was published as ``metaframe-widget``; both were renamed in 0.4.0. Kept so
#: notebooks and copied snippets written against the old name keep running --
#: it is the same class, not a subclass, so ``isinstance`` and ``pipe_to``
#: between the two names behave identically.
MetaframeWidget = Frame
