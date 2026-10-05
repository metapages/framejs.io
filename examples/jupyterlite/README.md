# JupyterLite Example

Run `framejs` entirely in the browser — no Python server required.

JupyterLite uses WebAssembly (Pyodide) to run a full Jupyter environment
client-side. The `anywidget` package is pre-installed at build time (required
for widget module registration), while `framejs` is installed at
runtime via `%pip install`.

## Prerequisites

- Python 3.10+
- [just](https://github.com/casey/just) command runner (or run the commands manually)

## Build

```bash
just jupyterlite-build
```

This creates a virtual environment, installs build dependencies, and runs
`jupyter lite build`. The output is a static site in
`examples/jupyterlite/_output/`.

## Serve locally

```bash
just jupyterlite-serve
```

Open http://localhost:8000 and navigate to `metaframe_demo.ipynb`.

## Deploy

The `_output/` directory is a self-contained static site. Deploy it anywhere
(GitHub Pages, Netlify, Cloudflare Pages, etc.) or embed it via `<iframe>`:

```html
<iframe src="https://your-host/path/notebooks/index.html?path=metaframe_demo.ipynb"
        width="100%" height="600" frameborder="0"></iframe>
```

## Notes

- **anywidget must be pre-installed** in the JupyterLite build. It cannot be
  installed via `micropip` at runtime due to how JupyterLab widget module
  registration works ([anywidget#534](https://github.com/manzt/anywidget/issues/534)).
- `framejs` is pure Python and installs fine via `%pip install` at
  runtime inside the Pyodide kernel.
