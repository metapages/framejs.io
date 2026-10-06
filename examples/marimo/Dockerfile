# Base image bundles Python, Playwright, and pre-installed Chromium/Firefox/WebKit.
# Pin the version to match the playwright Python package in the image.
# Check latest: https://mcr.microsoft.com/v2/playwright/python/tags/list
FROM mcr.microsoft.com/playwright/python:v1.58.0-jammy

WORKDIR /app

# Install the canonical framejs package from python/ first
COPY python/pyproject.toml python/README.md python/LICENSE ./python/
COPY python/src/ ./python/src/
RUN pip install --no-cache-dir -e "./python"

# Install the marimo example dev deps (pytest, marimo, pytest-playwright,
# requests).  The browsers are already present in the base image;
# no `playwright install` step is required.
COPY examples/marimo/pyproject.toml ./examples/marimo/
RUN pip install --no-cache-dir -e "./examples/marimo[dev]"

# Copy demo and tests last so source-code changes don't bust the layer
# that installs heavy dependencies.
COPY examples/marimo/demo.py ./examples/marimo/
COPY examples/marimo/tests/ ./examples/marimo/tests/
