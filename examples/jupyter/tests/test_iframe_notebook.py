"""
Unit tests for examples/iframe_inputs.ipynb — frames in a notebook with a plain
iframe, no anywidget. The helpers under test are executed straight out of the
notebook, so these check the code people actually copy.
"""

import base64
import builtins
import json
import urllib.parse
from pathlib import Path

import pytest

NOTEBOOK = Path(__file__).parent.parent / "examples" / "iframe_inputs.ipynb"

# btoa(encodeURIComponent(JSON.stringify(VALUE))), computed with node — i.e. what
# @metapages/hash-query (and so the framejs.io runtime) produces and expects.
VALUE = {
    "message": "héllo ✓ from Python",
    "data": [1, 2, 3],
    "nested": {"ok": True, "none": None, "q": "a&b=c#?d"},
}
JS_ENCODED = (
    "JTdCJTIybWVzc2FnZSUyMiUzQSUyMmglQzMlQTlsbG8lMjAlRTIlOUMlOTMlMjBmcm9tJTIw"
    "UHl0aG9uJTIyJTJDJTIyZGF0YSUyMiUzQSU1QjElMkMyJTJDMyU1RCUyQyUyMm5lc3RlZCUy"
    "MiUzQSU3QiUyMm9rJTIyJTNBdHJ1ZSUyQyUyMm5vbmUlMjIlM0FudWxsJTJDJTIycSUyMiUz"
    "QSUyMmElMjZiJTNEYyUyMyUzRmQlMjIlN0QlN0Q="
)


def _code_cells():
    nb = json.loads(NOTEBOOK.read_text())
    return ["".join(c["source"]) for c in nb["cells"] if c["cell_type"] == "code"]


@pytest.fixture(scope="module")
def helpers():
    """The notebook's helper cell, executed with anywidget made unimportable."""
    cell = next(c for c in _code_cells() if "def encode_json_hash_param" in c)
    real_import = builtins.__import__

    def guarded_import(name, *args, **kwargs):
        if name.split(".")[0] in ("anywidget", "metaframe_widget", "ipywidgets"):
            raise ImportError(f"{name} must not be needed by the iframe example")
        return real_import(name, *args, **kwargs)

    builtins.__import__ = guarded_import
    try:
        ns: dict = {}
        exec(cell, ns)
    finally:
        builtins.__import__ = real_import
    return ns


def _decode_like_hash_query(encoded: str):
    """JSON.parse(decodeURIComponent(atob(encoded)))"""
    return json.loads(urllib.parse.unquote(base64.b64decode(encoded).decode("ascii")))


def test_encoding_matches_hash_query_byte_for_byte(helpers):
    assert helpers["encode_json_hash_param"](VALUE) == JS_ENCODED


def test_encoding_round_trips(helpers):
    assert _decode_like_hash_query(helpers["encode_json_hash_param"](VALUE)) == VALUE


def test_frame_url_sets_inputs_and_keeps_other_params(helpers):
    url = helpers["frame_url_with_inputs"](
        "https://framejs.io/#?js=abc&inputs=stale", {"a": 1}
    )
    base, fragment = url.split("#?")
    assert base == "https://framejs.io/"
    params = dict(p.split("=", 1) for p in fragment.split("&"))
    assert params["js"] == "abc"
    assert _decode_like_hash_query(params["inputs"]) == {"a": 1}


def test_frame_url_without_existing_hash(helpers):
    url = helpers["frame_url_with_inputs"]("https://framejs.io/j/abc", {"a": 1})
    assert url.startswith("https://framejs.io/j/abc#?inputs=")


def test_frame_with_inputs_is_a_plain_iframe(helpers):
    frame = helpers["frame_with_inputs"]("https://framejs.io/j/abc", {"a": 1})
    html = frame._repr_html_()
    assert html.lstrip().startswith("<iframe")
    assert "#?inputs=" in html


def test_notebook_never_imports_a_widget_library():
    for cell in _code_cells():
        for banned in ("anywidget", "metaframe_widget", "ipywidgets"):
            assert banned not in cell, f"iframe example must not use {banned}"
