"""
Browser integration tests for the MetaframeWidget using Playwright + JupyterLab.

Test tiers:
  @pytest.mark.integration  — needs a running JupyterLab (lab_url fixture)
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

NOTEBOOK_LAB_PATH = "examples/demo.ipynb"


def _open_notebook(page: Page, lab_url: str, path: str = NOTEBOOK_LAB_PATH) -> None:
    """Navigate to a notebook (the demo by default) in JupyterLab."""
    # Build the direct notebook URL
    base, query = lab_url.split("?", 1)
    # `reset`: start from an empty workspace. JupyterLab otherwise restores the
    # previous test's tabs, so two notebooks are open, `.jp-NotebookPanel` is
    # ambiguous, and "Run All" can hit the wrong one.
    notebook_url = f"{base}/tree/{path}?{query}&reset"
    page.goto(notebook_url)
    # Wait for the notebook panel to be ready
    expect(page.locator(".jp-NotebookPanel")).to_be_visible(timeout=20_000)


def _run_all_cells(page: Page) -> None:
    """Execute all cells via the JupyterLab Run menu.

    JupyterLab 4.x does not expose window.app or window.jupyterapp;
    clicking the menu is the most reliable cross-version approach.
    """
    page.locator(".lm-MenuBar-item", has_text="Run").click()
    page.locator(".lm-Menu-item[data-command='runmenu:run-all']").click()


@pytest.mark.integration
def test_lab_loads(page: Page, lab_url: str):
    """JupyterLab starts and the launcher/file-browser is visible."""
    page.goto(lab_url)
    expect(
        page.locator(".jp-Launcher, .jp-FileBrowser")
    ).to_be_visible(timeout=15_000)


@pytest.mark.integration
def test_notebook_opens(page: Page, lab_url: str):
    """The demo notebook opens and its cells are visible."""
    _open_notebook(page, lab_url)
    # At least one code cell should be present
    expect(page.locator(".jp-CodeCell").first).to_be_visible(timeout=10_000)


@pytest.mark.integration
def test_cells_execute_without_traceback(page: Page, lab_url: str):
    """All notebook cells execute without raising a Python exception."""
    _open_notebook(page, lab_url)
    _run_all_cells(page)

    # Give the kernel time to execute all cells
    page.wait_for_timeout(8_000)

    # Check that no cell output contains a Python traceback
    outputs = page.locator(".jp-OutputArea-output").all()
    for output in outputs:
        text = output.inner_text()
        assert "Traceback (most recent call last)" not in text, (
            f"Python traceback found in cell output:\n{text[:300]}"
        )


@pytest.mark.integration
@pytest.mark.network
def test_widget_output_area_renders(page: Page, lab_url: str):
    """The anywidget output area appears after cells run (requires CDN load).

    JupyterLab 4.x does not set data-mime-type on output divs; instead we
    check that an output area containing an iframe is present, which means
    anywidget's ESM ran and injected its container.
    """
    _open_notebook(page, lab_url)
    _run_all_cells(page)

    widget_view = page.locator(".jp-OutputArea-output:has(iframe)")
    expect(widget_view.first).to_be_visible(timeout=60_000)


@pytest.mark.integration
@pytest.mark.network
def test_widget_iframe_renders(page: Page, lab_url: str):
    """The metaframe iframe is injected into the widget container by the ESM
    (requires CDN load of @metapages/metapage and framejs.io)."""
    _open_notebook(page, lab_url)
    _run_all_cells(page)

    # The ESM creates a container div with an iframe inside the output area
    iframe = page.locator(".jp-OutputArea-output iframe")
    expect(iframe.first).to_be_visible(timeout=60_000)


# Frames from examples/demo.ipynb.
ECHO_ID = "019f61392e0778f8aba8dd7ffe35a83c"  # framejs.app/j/<uuid>: echoes inputs
DOUBLER_ID = "7099ba440f37b858bf33c5fd09ae04077a92318c7abc7f7669117db540d776c9"


def _frame_text(page: Page, frame_id: str) -> str:
    """Body text of every frame whose URL carries this id (the framejs.app
    wrapper AND the framejs.io runtime nested in it), concatenated."""
    texts = []
    for frame in page.frames:
        if frame_id in frame.url:
            try:
                texts.append(frame.evaluate("() => document.body?.innerText ?? ''"))
            except Exception:
                pass
    return "\n".join(texts)


def _wait_for_frame_text(page: Page, frame_id: str, needle: str, timeout_s: int = 60) -> str:
    deadline = page.evaluate("() => Date.now()") + timeout_s * 1000
    text = ""
    while page.evaluate("() => Date.now()") < deadline:
        text = _frame_text(page, frame_id)
        if needle in text:
            return text
        page.wait_for_timeout(1_000)
    raise AssertionError(
        f"frame {frame_id} never showed {needle!r}; it showed: {text[:300]!r}"
    )


@pytest.mark.integration
@pytest.mark.network
def test_widget_data_round_trips(page: Page, lab_url: str):
    """Data actually flows through the widgets — not merely an iframe appearing.

    `test_widget_iframe_renders` stayed green for weeks while every widget built
    on a framejs.app URL was deaf: the frame rendered, but no input reached it
    and no output left it (the framejs.app embed wrapper did not relay the
    metapage protocol). This asserts both directions:

      Python -> echo:           echo's frame displays the inputs Python set.
      echo -> Python -> doubler: echo's OUTPUT reaches Python, whose pipe_to()
                                 pushes it to the doubler, which doubles it.
    """
    _open_notebook(page, lab_url)
    _run_all_cells(page)

    _wait_for_frame_text(page, ECHO_ID, "hello from Python")
    # [10, 20, 30] piped through echo and doubled.
    _wait_for_frame_text(page, DOUBLER_ID, "[20,40,60]")


# --- examples/iframe_inputs.ipynb: plain iframe, no anywidget -----------------

IFRAME_NOTEBOOK = "examples/iframe_inputs.ipynb"
CHART_ID = "f500b0bdbe8d4a1690803014bc9ac918"


@pytest.mark.integration
@pytest.mark.network
def test_iframe_notebook_frames_receive_inputs(page: Page, lab_url: str):
    """Inputs encoded into the URL by Python reach the frames — no widget layer."""
    _open_notebook(page, lab_url, IFRAME_NOTEBOOK)
    _run_all_cells(page)

    _wait_for_frame_text(page, ECHO_ID, "hello from Python")
    _wait_for_frame_text(page, ECHO_ID, "change me, then re-run this cell")

    # The Plotly frame drew the series computed in Python.
    deadline_ms = 60_000
    traces = 0
    for _ in range(deadline_ms // 1_000):
        traces = max(
            [0]
            + [
                f.evaluate("() => document.querySelectorAll('.scatterlayer .trace').length")
                for f in page.frames
                if CHART_ID in f.url
            ]
        )
        if traces >= 2:
            break
        page.wait_for_timeout(1_000)
    assert traces >= 2, f"chart drew {traces} traces, expected the 2 series"

    # Plain iframes all the way: no Jupyter widget views were created.
    assert page.locator(".jp-OutputArea-output .jupyter-widgets").count() == 0


@pytest.mark.integration
@pytest.mark.network
def test_iframe_notebook_rerun_recreates_the_frame(page: Page, lab_url: str):
    """Changing inputs means re-running the cell, which REPLACES the iframe."""
    _open_notebook(page, lab_url, IFRAME_NOTEBOOK)
    _run_all_cells(page)

    cell = page.locator(".jp-CodeCell", has_text="change me, then re-run this cell")
    old = cell.locator(".jp-OutputArea-output iframe")
    expect(old).to_have_count(1, timeout=60_000)
    old_handle = old.element_handle()

    cell.locator(".jp-InputArea-editor").click()
    page.keyboard.press("Control+Enter")

    page.wait_for_function("(el) => !el.isConnected", arg=old_handle, timeout=30_000)
    expect(cell.locator(".jp-OutputArea-output iframe")).to_have_count(1, timeout=30_000)
