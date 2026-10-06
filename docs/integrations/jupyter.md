# Jupyter

Use any metaframe as an interactive Jupyter notebook widget with the `framejs` package.

This guide walks you through every step — from installing Python to building multi-widget pipelines.

## Step 1: Create a virtual environment

A virtual environment keeps your project's packages isolated. This is strongly recommended.

```bash
# Create a new directory for your project
mkdir my-metaframe-project
cd my-metaframe-project

# Create a virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows PowerShell
# .venv\Scripts\activate.bat     # Windows CMD
```

Your terminal prompt should now show `(.venv)` at the beginning, confirming the environment is active.

## Step 2: Install JupyterLab and framejs

```bash
pip install framejs jupyterlab
```

This installs both JupyterLab (the notebook interface) and `framejs` (the metaframe integration). The widget is built on [anywidget](https://anywidget.dev/), so all widget dependencies are handled automatically.

::: info Formerly `metaframe-widget`
The `framejs` Python package was previously published as `metaframe-widget`
(and the class as `MetaframeWidget`). Both old names still work, but new code
should use `framejs` / `Frame`.
:::

::: tip Already have Jupyter installed?
If you already have a Jupyter environment, you only need:
```bash
pip install framejs
```
:::

## Step 3: Launch JupyterLab

```bash
jupyter lab
```

This opens JupyterLab in your browser (usually at `http://localhost:8888`). If it doesn't open automatically, copy the URL from the terminal output — it includes an authentication token.

## Step 4: Create a new notebook

1. In JupyterLab, click the **"+"** button or go to **File → New → Notebook**
2. Select the **Python 3** kernel when prompted
3. You now have an empty notebook ready to go

## Step 5: Display your first widget

In the first cell of your notebook, type and run (`Shift+Enter`):

```python
from framejs import Frame

w = Frame(url="https://framejs.app/j/f14d583125634c23851453c8038ddb7c", height="200px")
w
```

You should see a small "Hello 👋" card rendered directly in your notebook. It is a
saved frame — a little JavaScript app living at that URL — running live in an
iframe, and it is waiting for you to send it something from Python.

::: tip Always point a widget at a *saved* frame
`Frame(url="https://framejs.io/")` or `Frame(url="https://framejs.app/")` loads the framejs editor itself rather than an
app, so you get the editor's own tutorial inside your notebook, which is rarely
what you want. Build what you need at [framejs.app](https://framejs.app/), then copy the URL.
:::

## Creating widgets

A widget is always created from a URL — the URL *is* the metaframe. There are two
ways to get one:

### From a short URL

If you have a saved metaframe, use its [short url](../guide/short-urls):

```python
w = Frame(url="https://framejs.io/j/<uuid>")
w
```

This is the most compact way to embed a metaframe — the code lives behind the
short URL instead of being inlined in the cell.

There are two kinds of short URL, created by two different toolbar buttons:

- **`/j/<uuid>`** — a durable, editable frame, created when you **Save** the
  metaframe. This is the form to keep in a notebook. `framejs.io/j/<uuid>` and
  `framejs.app/j/<uuid>` are equivalent, and you can paste either: the widget
  loads the `framejs.io` form either way (see below).
- **`/j/<sha256>`** — a temporary, content-addressed snapshot, created with
  **Create expiring snapshot**. It is kept for about a month and then
  garbage-collected, so use it for quick shares — not for anything you want to
  keep.

#### Editing and saving back

You can edit the code directly inside the widget. Two toolbar buttons persist
your work:

- **Save** — stores a durable, editable frame and gives you a permanent
  `framejs.io/j/<uuid>` URL. Paste that into your cell (replacing the old URL) so
  the notebook always reloads your saved version.
- **Create expiring snapshot** — mints a temporary `/j/<sha256>` snapshot without
  leaving the notebook. It is pushed back to Python, so you can read it directly:

```python
w.saved_url  # → "https://framejs.io/j/<sha256>"
```

Or react to it programmatically (the same callback caveat applies — see
[React to output changes](#react-to-output-changes) for where a callback's
`print` output actually goes):

```python
import ipywidgets as widgets

log = widgets.Output()
w.on_saved_url_change(lambda change: log.append_stdout(f"Snapshot: {change['new']}\n"))
log
```

A snapshot does not reload the iframe, so your editing session is never
interrupted — but because it expires, copy anything you want to keep into a
durable **Save** (`/j/<uuid>`).

### From a full URL

You can paste any full metaframe URL. These tend to be long since they encode the code in the hash:

```python
w = Frame(url="https://framejs.io/#?js=...")
w
```

::: tip Writing your own code
To embed custom JavaScript, build it in the [framejs.io](https://framejs.io/)
editor and click **Save** — that stores a durable frame and gives you a permanent
`framejs.io/j/<uuid>` URL to paste into `url=`. (For a quick throwaway link,
**Create expiring snapshot** mints a temporary `/j/<sha256>` instead.) Keeping the
code behind a URL rather than inlining it in a cell is what makes a metaframe
portable and saveable: the URL is the one thing you copy, share, and persist.
Inside the editor you have the full metaframe API — `getInput()`, `setOutput()`,
`onInputs()`, and a `<div id="root">` for rendering.
:::

::: info Which host the widget loads
`framejs.app` is the account layer — the host the share panel gives you — while
`framejs.io` is the runtime that actually serves a frame as an embeddable
widget. Only framejs.io sends the CORS headers the widget needs, so a
`framejs.app/j/<id>` URL loaded directly from a notebook on
`http://localhost:8888` fails with:

```
Access to fetch at 'https://framejs.app/j/<id>/metaframe.json' from origin
'http://localhost:8888' has been blocked by CORS policy
```

`Frame` therefore rewrites `framejs.app/j/<id>` to `framejs.io/j/<id>` before
loading it, keeping any `?v=` pin and `#?inputs=` fragment. Reading `w.url` back
still returns exactly the URL you passed; `framejs.runtime_url(url)` applies the
same mapping if you need it yourself. Everything else — full `#?js=` URLs,
framejs.io URLs, local dev stacks — is loaded unchanged.
:::

## Sending data from Python to the widget

Use `set_inputs()` to send a dictionary, or `set_input()` for a single key:

```python
# Send multiple values at once
w.set_inputs({"data": [1, 2, 3], "message": "hello from Python"})

# Send a single value
w.set_input("count", 42)
```

The widget receives these as inputs. If your widget code defines `onInputs`, it will be called with the new values.

**Full example — send data and display it:**

Using the same widget from Step 5 (it pretty-prints whatever it receives):

```python
w.set_inputs({
    "name": "Alice",
    "scores": [95, 87, 92],
    "metadata": {"course": "CS101"}
})
```

The card swaps its "waiting" message for your data. The widget updates live — no
need to re-run the cell that displays it.

## Reading data back from the widget

### Read current outputs

```python
print(w.outputs)
```

::: info Outputs are asynchronous
The widget runs in an iframe, so outputs arrive asynchronously. If `w.outputs` shows `{}`, wait a moment and re-run the cell. The outputs populate once the widget's JavaScript has executed.
:::

### React to output changes

Register a callback that fires whenever the widget emits new outputs:

```python
import ipywidgets as widgets

log = widgets.Output()
w.on_outputs_change(lambda change: log.append_stdout(f"Got: {change['new']}\n"))
log
```

The callback receives a dict with `"new"` (the updated outputs) and `"old"` (the previous outputs).

::: warning `print()` in a callback goes somewhere you are not looking
The callback runs while the kernel is handling a message from the **browser**,
not while a cell is executing — so there is no "current cell" for its output to
land in. A bare `print("Got:", change["new"])` therefore looks like it does
nothing at all: JupyterLab files it under **View → Show Log Console**, and other
front-ends may drop it silently.

Append to an `ipywidgets.Output` instead, as above. `append_stdout` is the
method to use from a callback — it does not depend on which cell is running.
(`ipywidgets` is already installed; `framejs` is built on it.)
:::

**Full example — round-trip data through a widget:**

```python
from framejs import Frame

# Widget that doubles every number in the "data" input
doubler = Frame(
    url="https://framejs.io/j/7099ba440f37b858bf33c5fd09ae04077a92318c7abc7f7669117db540d776c9",
    height="100px",
)
doubler
```

Then in subsequent cells:

```python
import ipywidgets as widgets

# Register a callback to capture outputs (see the warning above about print)
log = widgets.Output()
doubler.on_outputs_change(lambda change: log.append_stdout(f"Doubled: {change['new']}\n"))
log
```

```python
# Send data — `log` fills in when the widget responds
doubler.set_inputs({"data": [10, 20, 30]})
```

```python
# Read the outputs directly
doubler.outputs  # → {"doubled": [20, 40, 60]}
```

## Piping widgets together

Connect the output of one widget to the input of another to build processing pipelines:

```python
from framejs import Frame

# Source widget: echoes inputs as outputs
source = Frame(
    url="https://framejs.app/j/470bc366690396d1d976dc8e259f146a49475f44fdb6bb770ebaad70ca24a22b",
    height="80px",
)

# Sink widget: receives piped data
sink = Frame(
    url="https://framejs.app/j/572a76ea8bb83cb7258af857078fbc0b3821e5a3c23f282652147bbc3868e260",
    height="80px",
)

# Connect: when source emits "data", push it to sink's "data" input
source.pipe_to(sink, output_key="data", input_key="data")
```

Display both widgets:

```python
source
```

```python
sink
```

Then trigger the pipeline:

```python
source.set_inputs({"data": [1, 2, 3]})
# The sink widget automatically updates with the piped data
```

## Real-world example: CSV data visualization

Load a CSV file in Python and render it as an interactive table in a widget:

```python
import csv
from framejs import Frame

# 1. Load data
with open("data.csv") as f:
    rows = list(csv.DictReader(f))
print(f"Loaded {len(rows)} rows")

# 2. Create a table widget (a small "render rows as an HTML table" metaframe,
#    built in the framejs.io editor and saved to this short URL)
table = Frame(
    url="https://framejs.app/j/9047247167a49aa06f205e26f4afc2db7955af55cecf4204336f7e94e67f0a36",
    height="300px",
)
table
```

```python
# 3. Send data to the widget
table.set_inputs({"rows": rows})
```

## Widget sizing

Control the widget dimensions with `width` and `height` (CSS values):

```python
# Default: 100% width, 400px height
w = Frame(url="...", width="100%", height="400px")

# Smaller widget
w = Frame(url="https://framejs.io/j/...", height="150px", width="50%")
```

## Without anywidget: a plain iframe

If you only need to send data **into** a frame, you don't need any package.
Encode the inputs into the frame's URL and show it with `IPython.display.IFrame`.
This works anywhere HTML output renders, including exported HTML and nbviewer.

```python
import base64, json, urllib.parse
from IPython.display import IFrame

def encode_json_hash_param(value) -> str:
    # Same as framejs's JSON hash params: btoa(encodeURIComponent(JSON.stringify(value)))
    text = json.dumps(value, separators=(",", ":"), ensure_ascii=False)
    return base64.b64encode(
        urllib.parse.quote(text, safe="-_.!~*'()").encode("ascii")
    ).decode("ascii")

url = "https://framejs.io/j/019f61392e0778f8aba8dd7ffe35a83c"
IFrame(f"{url}#?inputs={encode_json_hash_param({'message': 'hello'})}",
       width="100%", height=200)
```

The tradeoff: the inputs live in the URL, so **to change them you re-run the
cell**, which rebuilds the iframe and restarts the frame from scratch. Nothing
updates in place, and nothing comes back: no outputs, no
`on_outputs_change`, no `pipe_to`. For those, use the `framejs` widget. Keep the
data to kilobytes. For anything larger, pass
`{"type": "url", "value": "https://…"}` and the frame fetches it itself.

The full example, with a helper that keeps a URL's other hash params, is
[`examples/jupyter/examples/iframe_inputs.ipynb`](https://github.com/metapages/framejs.io/blob/main/examples/jupyter/examples/iframe_inputs.ipynb).

## Supported environments

`framejs` works in:

- **JupyterLab** — full support
- **Jupyter Notebook** (classic) — full support
- **VS Code** — Jupyter notebooks in VS Code work out of the box
- **Google Colab** — works via anywidget compatibility

## Developer guide

### Running locally with Docker

```bash
just jupyter-docker
```

Open [http://localhost:8888](http://localhost:8888) in your browser.

To use a different port:

```bash
JUPYTER_PORT=9999 just jupyter-docker
```

### Running locally without Docker

```bash
pip install -e "python/[dev]"
pip install -e "examples/jupyter[dev]"
jupyter lab --ServerApp.root_dir=examples/jupyter
```

### Running tests

```bash
just test-jupyter          # unit + notebook + browser (Docker)
just test-jupyter-unit     # unit tests only
just test-jupyter-notebook # nbmake notebook execution
just test-jupyter-browser  # Playwright browser tests (no network)
```

### Publishing

The widget is published from the canonical `python/` directory:

```bash
just python-build          # builds python/dist/
just python-publish-local  # publishes to PyPI
```

Or via git tag for CI: `git tag python-v0.1.0 && git push origin python-v0.1.0`
