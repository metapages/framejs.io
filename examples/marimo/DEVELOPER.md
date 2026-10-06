# marimo Examples — Developer Guide

## Overview

This directory contains integration tests and examples for `framejs` in marimo. The widget source code lives in [`python/`](../../python/) at the repo root.

## Running locally with Docker

```bash
just marimo-docker
```

Open [http://localhost:2718](http://localhost:2718) in your browser.

To use a different port:

```bash
MARIMO_PORT=3000 just marimo-docker
```

## Running locally without Docker

```bash
pip install -e "python/[dev]"
pip install -e "examples/marimo[dev]"
marimo edit examples/marimo/demo.py
```

## Publishing

The widget is published from the canonical `python/` directory:

```bash
just python-build          # builds python/dist/
just python-publish-local  # publishes to PyPI
```

Or via git tag for CI: `git tag python-v0.1.0 && git push origin python-v0.1.0`
