import anywidget
import traitlets

from ._esm import ESM


class MetaframeWidget(anywidget.AnyWidget):
    """Widget that renders a metaframe iframe (works in Jupyter and marimo).

    Args:
        url: Full metaframe URL (including hash params).
        inputs: Dict of inputs to push to the metaframe.
        outputs: Dict of outputs received from the metaframe (read-only).
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

    def pipe_to(self, target: "MetaframeWidget", output_key: str, input_key: str = None):
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
