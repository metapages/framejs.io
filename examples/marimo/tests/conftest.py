import os
import socket
import subprocess
import tempfile
import time
from pathlib import Path

import pytest
import requests

# Root of the examples/marimo package
PACKAGE_ROOT = Path(__file__).parent.parent

_IN_DOCKER = os.path.exists("/.dockerenv")


# pytest-playwright fixture override: add --no-sandbox inside Docker so
# Chromium can run without user-namespace support.
@pytest.fixture(scope="session")
def browser_type_launch_args(browser_type_launch_args):
    if _IN_DOCKER:
        args = list(browser_type_launch_args.get("args", []))
        args += ["--no-sandbox", "--disable-dev-shm-usage"]
        return {**browser_type_launch_args, "args": args}
    return browser_type_launch_args


# Set a locale so marimo's Intl.Locale doesn't fail in minimal Docker images.
@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    return {**browser_context_args, "locale": "en-US"}


def _find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


def _wait_for_server(url: str, timeout: float = 30) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            if requests.get(url, timeout=1).status_code < 500:
                return True
        except Exception:
            pass
        time.sleep(0.5)
    return False


@pytest.fixture(scope="session")
def marimo_url():
    """Start a marimo server in run mode and yield its base URL.

    The server is started from the package root so that demo.py is accessible.
    The framejs package must already be installed in the environment
    (e.g. via `pip install -e ".[dev]"`).
    """
    port = _find_free_port()

    log = tempfile.NamedTemporaryFile(mode="w", suffix="-marimo.log", delete=False)

    proc = subprocess.Popen(
        [
            "marimo",
            "run",
            f"--port={port}",
            "--host=127.0.0.1",
            "--no-token",
            "demo.py",
        ],
        cwd=str(PACKAGE_ROOT),
        stdout=log,
        stderr=log,
    )

    base_url = f"http://localhost:{port}"

    if not _wait_for_server(base_url, timeout=60):
        proc.terminate()
        log.flush()
        log_text = Path(log.name).read_text()
        pytest.fail(
            f"marimo did not start within 60 seconds.\n\n"
            f"--- marimo log ({log.name}) ---\n{log_text[-3000:]}"
        )

    yield base_url

    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()
    finally:
        log.close()
        Path(log.name).unlink(missing_ok=True)
