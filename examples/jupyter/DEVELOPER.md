# Jupyter Examples — Developer Guide

## Overview

This directory contains integration tests and example notebooks for `framejs`. The widget source code lives in [`python/`](../../python/) at the repo root.

## Running locally with Docker

```bash
just jupyter-docker
```

Open [http://localhost:8888](http://localhost:8888) in your browser.

To use a different port:

```bash
JUPYTER_PORT=9999 just jupyter-docker
```

## Running locally without Docker

```bash
pip install -e "python/[dev]"
pip install -e "examples/jupyter[dev]"
jupyter lab --ServerApp.root_dir=examples/jupyter
```

## Running tests

```bash
just test-jupyter          # unit + notebook + browser (Docker)
just test-jupyter-unit     # unit tests only
just test-jupyter-notebook # nbmake notebook execution
just test-jupyter-browser  # Playwright browser tests (no network)
```

## Publishing

The widget is published from the canonical `python/` directory:

```bash
just python-build          # builds python/dist/
just python-publish-local  # publishes to PyPI
```

Or via git tag for CI: `git tag python-v0.1.0 && git push origin python-v0.1.0`
