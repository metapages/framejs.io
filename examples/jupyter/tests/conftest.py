import os
import socket
import subprocess
import tempfile
import time
from pathlib import Path

import pytest
import requests

# Root of the examples/jupyter package
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
def lab_url():
    """Start a JupyterLab server and yield its base URL (with token).

    The server is started from the package root so that the notebook at
    examples/demo.ipynb is accessible as 'examples/demo.ipynb' in the lab.
    The framejs package must already be installed in the environment
    (e.g. via `pip install -e ".[dev]"`).
    """
    port = _find_free_port()
    token = "playwright-test-token"

    log = tempfile.NamedTemporaryFile(mode="w", suffix="-jupyter.log", delete=False)

    proc = subprocess.Popen(
        [
            "jupyter",
            "lab",
            f"--port={port}",
            "--no-browser",
            f"--ServerApp.token={token}",
            "--ServerApp.password=",
            "--ServerApp.disable_check_xsrf=True",
            "--allow-root",
        ],
        cwd=str(PACKAGE_ROOT),
        stdout=log,
        stderr=log,
    )

    base_url = f"http://localhost:{port}"
    health_url = f"{base_url}/api?token={token}"

    if not _wait_for_server(health_url, timeout=60):
        proc.terminate()
        log.flush()
        log_text = Path(log.name).read_text()
        pytest.fail(
            f"JupyterLab did not start within 60 seconds.\n\n"
            f"--- JupyterLab log ({log.name}) ---\n{log_text[-3000:]}"
        )

    yield f"{base_url}/lab?token={token}"

    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()
    finally:
        log.close()
        Path(log.name).unlink(missing_ok=True)
