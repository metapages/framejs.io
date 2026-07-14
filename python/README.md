# metaframe-widget

An [anywidget](https://anywidget.dev/) for embedding [metaframe](https://framejs.io/docs) and [metapage](https://docs.metapage.io/) URLs in Jupyter and marimo notebooks.

## Install

```bash
pip install metaframe-widget
```

With environment extras:

```bash
pip install "metaframe-widget[jupyter]"   # includes jupyterlab
pip install "metaframe-widget[marimo]"    # includes marimo
```

## Quick start

### Jupyter

```python
from metaframe_widget import MetaframeWidget

w = MetaframeWidget(url="https://framejs.io/#?js=...", height="300px")
w
```

### marimo

```python
import marimo as mo
from metaframe_widget import MetaframeWidget

w = MetaframeWidget(url="https://framejs.io/#?js=...", height="300px")
mo.ui.anywidget(w)
```

A widget is always created from a URL. To embed your own code, build and save it
at [framejs.io](https://framejs.io/) — the editor mints a short URL you can paste
into `url=`. The URL is the portable, saveable form of a metaframe; the code
itself lives behind it rather than being inlined in your notebook.

### URL forms

Any of these work as `url=`:

```python
# Raw / full URL — the code is inlined in the hash (can get very long)
MetaframeWidget(url="https://framejs.io/#?js=...")

# Expiring snapshot — content-addressed, kept ~30 days, then garbage-collected
# (editor: "Create expiring snapshot")
MetaframeWidget(url="https://framejs.io/j/<sha256>")

# Durable, editable frame — permanent, tied to your account (editor: "Save")
# framejs.io/j/<uuid> and framejs.app/j/<uuid> resolve to the same frame
MetaframeWidget(url="https://framejs.io/j/<uuid>")
```

Prefer the durable `/j/<uuid>` form in notebooks you keep. See
[Short URLs](https://framejs.io/docs/guide/short-urls) for the full comparison.

## API reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `str` | `""` | Full metaframe URL (including hash params) |
| `inputs` | `dict` | `{}` | Dict of inputs to push to the metaframe |
| `outputs` | `dict` | `{}` | Dict of outputs received from the metaframe (read-only) |
| `width` | `str` | `"100%"` | CSS width for the widget container |
| `height` | `str` | `"400px"` | CSS height for the widget container |
| `allow` | `str` | `""` | iframe `allow` attribute (e.g. `"camera; microphone"`) |

### Methods

- **`set_inputs(d)`** — merge a dict into current inputs
- **`set_input(key, value)`** — set a single input key
- **`on_outputs_change(callback)`** — register a callback for output changes
- **`on_saved_url_change(callback)`** — register a callback for when the user creates an expiring snapshot (`/j/<sha256>`) inside the widget
- **`pipe_to(target, output_key, input_key=None)`** — connect an output to another widget's input

## Piping widgets

```python
source = MetaframeWidget(url="...")
sink = MetaframeWidget(url="...")
source.pipe_to(sink, output_key="result", input_key="data")
```

## Links

- [GitHub](https://github.com/metapages/framejs.io)
- [Jupyter examples](https://github.com/metapages/framejs.io/tree/main/examples/jupyter)
- [marimo examples](https://github.com/metapages/framejs.io/tree/main/examples/marimo)
