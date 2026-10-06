# framejs

An [anywidget](https://anywidget.dev/) for embedding [framejs](https://framejs.io/docs)
frames (and [metapage](https://docs.metapage.io/) URLs) in Jupyter and marimo
notebooks.

> **Renamed in 0.4.0.** This package was published as `metaframe-widget`, and the
> class as `MetaframeWidget`. Both names still work — `metaframe-widget` now
> installs this package, and `MetaframeWidget` is an alias of `Frame` — but new
> code should use `framejs` and `Frame`.

## Install

```bash
pip install framejs
```

With environment extras:

```bash
pip install "framejs[jupyter]"   # includes jupyterlab
pip install "framejs[marimo]"    # includes marimo
```

## Quick start

### Jupyter

```python
from framejs import Frame

w = Frame(url="https://framejs.io/#?js=...", height="300px")
w
```

### marimo

```python
import marimo as mo
from framejs import Frame

w = Frame(url="https://framejs.io/#?js=...", height="300px")
mo.ui.anywidget(w)
```

A widget is always created from a URL. To embed your own code, build and save it
at [framejs.io](https://framejs.io/) — the editor mints a short URL you can paste
into `url=`. The URL is the portable, saveable form of a frame; the code itself
lives behind it rather than being inlined in your notebook.

### URL forms

Any of these work as `url=`:

```python
# Raw / full URL — the code is inlined in the hash (can get very long)
Frame(url="https://framejs.io/#?js=...")

# Expiring snapshot — content-addressed, kept ~30 days, then garbage-collected
# (editor: "Create expiring snapshot")
Frame(url="https://framejs.io/j/<sha256>")

# Durable, editable frame — permanent, tied to your account (editor: "Save")
# Paste either host: a framejs.app/j/<uuid> URL is loaded from framejs.io, the
# runtime that serves frames with CORS headers (a notebook cannot load the
# framejs.app one directly). `w.url` still reads back what you passed.
Frame(url="https://framejs.app/j/<uuid>")
```

Prefer the durable `/j/<uuid>` form in notebooks you keep. See
[Short URLs](https://framejs.io/docs/guide/short-urls) for the full comparison.

## API reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `str` | `""` | Full frame URL (including hash params) |
| `inputs` | `dict` | `{}` | Dict of inputs to push to the frame |
| `outputs` | `dict` | `{}` | Dict of outputs received from the frame (read-only) |
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
source = Frame(url="...")
sink = Frame(url="...")
source.pipe_to(sink, output_key="result", input_key="data")
```

## No anywidget? Use a plain iframe

To send data **into** a frame and nothing more, you need no package at all —
encode the inputs into the URL and show it with `IPython.display.IFrame`. See
[the Jupyter guide](https://framejs.io/docs/integrations/jupyter#without-anywidget-a-plain-iframe).

## Links

- [GitHub](https://github.com/metapages/framejs.io)
- [Jupyter examples](https://github.com/metapages/framejs.io/tree/main/examples/jupyter)
- [marimo examples](https://github.com/metapages/framejs.io/tree/main/examples/marimo)
