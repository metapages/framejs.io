# Base image bundles Python, Playwright, and pre-installed Chromium/Firefox/WebKit.
# Pin the version to match the playwright Python package in the image.
# Check latest: https://mcr.microsoft.com/v2/playwright/python/tags/list
FROM mcr.microsoft.com/playwright/python:v1.58.0-jammy

WORKDIR /app

# Install the canonical framejs package from python/ first
COPY python/pyproject.toml python/README.md python/LICENSE ./python/
COPY python/src/ ./python/src/
RUN pip install --no-cache-dir -e "./python"

# Install the Jupyter example dev deps (pytest, nbmake, pytest-playwright,
# jupyterlab, requests).  The browsers are already present in the base image;
# no `playwright install` step is required.
COPY examples/jupyter/pyproject.toml ./examples/jupyter/
RUN pip install --no-cache-dir -e "./examples/jupyter[dev]"

# Copy notebook(s) and tests last so source-code changes don't bust the layer
# that installs heavy dependencies.
COPY examples/jupyter/examples/ ./examples/jupyter/examples/
COPY examples/jupyter/tests/ ./examples/jupyter/tests/
