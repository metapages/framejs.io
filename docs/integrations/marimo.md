# marimo

Use metaframe-js widgets in [marimo](https://marimo.io) notebooks with reactive bindings.

## Installation

```bash
pip install metaframe-widget
```

## Basic usage

Wrap the widget with `mo.ui.anywidget()` to get reactive bindings:

```python
import marimo as mo
from metaframe_widget import MetaframeWidget

w = mo.ui.anywidget(MetaframeWidget(url="https://framejs.io/"))
w
```

The `url` can be any metaframe URL form:

```python
# Raw / full URL — code inlined in the hash
MetaframeWidget(url="https://framejs.io/#?js=...")

# Expiring snapshot — content-addressed, kept ~30 days (editor: "Create expiring snapshot")
MetaframeWidget(url="https://framejs.io/j/<sha256>")

# Durable, editable frame — permanent (editor: "Save")
# framejs.io/j/<uuid> and framejs.app/j/<uuid> are equivalent
MetaframeWidget(url="https://framejs.io/j/<uuid>")
```

Prefer the durable `/j/<uuid>` form in notebooks you keep — see
[Short URLs](../guide/short-urls) for the full comparison.

Then in a separate cell, `w.outputs` will reactively update when the metaframe emits output — any cell referencing it re-runs automatically.

```python
w.set_inputs({"data": [1, 2, 3]})
```

## Piping widgets

For piping, access the underlying widget via `.widget`:

```python
source.widget.pipe_to(sink.widget, output_key="result", input_key="data")
```

See `examples/marimo/demo.py` in the repo for a complete example.

## Developer guide

### Running locally with Docker

```bash
just marimo-docker
```

Open [http://localhost:2718](http://localhost:2718) in your browser.

To use a different port:

```bash
MARIMO_PORT=3000 just marimo-docker
```

### Running locally without Docker

```bash
pip install -e "python/[dev]"
pip install -e "examples/marimo[dev]"
marimo edit examples/marimo/demo.py
```

### Publishing

The widget is published from the canonical `python/` directory:

```bash
just build-python    # builds python/dist/
just publish-python  # publishes to PyPI
```

Or via git tag for CI: `git tag python-v0.1.0 && git push origin python-v0.1.0`
