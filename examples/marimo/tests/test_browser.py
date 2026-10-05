"""
Browser integration tests for Frame using Playwright + marimo.

Test tiers:
  @pytest.mark.integration  — needs a running marimo server (marimo_url fixture)
  @pytest.mark.network      — also needs external network (CDN + framejs.io)

Setup (one-time):
    pip install -e ".[dev]"
    playwright install chromium

Run (integration only, no network):
    pytest tests/test_browser.py -m "integration and not network"

Run (all, including network):
    pytest tests/test_browser.py -m integration
"""

import pytest
from playwright.sync_api import Page, expect


@pytest.mark.integration
def test_app_loads(page: Page, marimo_url: str):
    """marimo app starts and the page renders without crash."""
    page.goto(marimo_url)
    # marimo renders a #root container for its React app
    expect(page.locator("#root")).to_be_visible(timeout=15_000)


@pytest.mark.integration
def test_no_python_tracebacks(page: Page, marimo_url: str):
    """All cells execute without raising Python exceptions."""
    page.goto(marimo_url)
    # Give marimo time to execute all cells
    page.wait_for_timeout(10_000)

    body_text = page.locator("body").inner_text()
    assert "Traceback (most recent call last)" not in body_text, (
        "Python traceback found in page output"
    )


@pytest.mark.integration
@pytest.mark.network
def test_widget_iframes_render(page: Page, marimo_url: str):
    """At least one anywidget iframe appears after the app loads (requires CDN)."""
    page.goto(marimo_url)

    iframe = page.locator("iframe")
    expect(iframe.first).to_be_visible(timeout=60_000)


@pytest.mark.integration
@pytest.mark.network
def test_five_widget_pipeline_iframes(page: Page, marimo_url: str):
    """All widget iframes render, including the 5-widget pipeline.

    The demo has:
      Section 1: 1 iframe  (URL widget)
      Section 2: 1 iframe  (echo widget)
      Section 5: 5 iframes (pipeline via pipe_to)
    Total: at least 7 iframes.
    """
    page.goto(marimo_url)

    # Wait for the first iframe
    expect(page.locator("iframe").first).to_be_visible(timeout=60_000)

    # Allow time for all widgets to load their metaframes
    page.wait_for_timeout(15_000)

    iframes = page.locator("iframe")
    count = iframes.count()
    assert count >= 7, (
        f"Expected at least 7 iframes (1 URL + 1 echo + 5 pipeline), found {count}"
    )
