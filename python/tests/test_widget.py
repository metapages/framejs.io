from framejs import Frame


def test_create_widget():
    w = Frame(url="https://framejs.io/#?js=abc")
    assert w.url == "https://framejs.io/#?js=abc"
    assert w.inputs == {}
    assert w.outputs == {}
    assert w.height == "400px"


def test_set_inputs():
    w = Frame()
    w.set_inputs({"a": 1, "b": 2})
    assert w.inputs == {"a": 1, "b": 2}
    w.set_inputs({"b": 3, "c": 4})
    assert w.inputs == {"a": 1, "b": 3, "c": 4}


def test_set_input():
    w = Frame()
    w.set_input("x", 42)
    assert w.inputs == {"x": 42}
    w.set_input("y", "hello")
    assert w.inputs == {"x": 42, "y": "hello"}


def test_on_outputs_change():
    w = Frame()
    changes = []
    w.on_outputs_change(lambda change: changes.append(change))
    w.outputs = {"key": "value"}
    assert len(changes) == 1
    assert changes[0]["new"] == {"key": "value"}


def test_pipe_to():
    source = Frame()
    sink = Frame()
    source.pipe_to(sink, output_key="doubled", input_key="data")
    source.outputs = {"doubled": [2, 4, 6]}
    assert sink.inputs == {"data": [2, 4, 6]}


def test_pipe_to_default_key():
    source = Frame()
    sink = Frame()
    source.pipe_to(sink, output_key="result")
    source.outputs = {"result": 42}
    assert sink.inputs == {"result": 42}


def test_pipe_to_ignores_unrelated_keys():
    source = Frame()
    sink = Frame()
    source.pipe_to(sink, output_key="x")
    source.outputs = {"y": 99}
    assert sink.inputs == {}


def test_layout_height_synced_on_init():
    """layout.height must match the height trait so ipywidgets doesn't clear it."""
    w = Frame()
    assert w.layout.height == "400px"
    assert w.layout.width == "100%"


def test_layout_height_synced_with_custom_value():
    w = Frame(height="600px", width="80%")
    assert w.layout.height == "600px"
    assert w.layout.width == "80%"


def test_layout_height_updates_on_change():
    """Changing height trait after init must propagate to layout."""
    w = Frame()
    w.height = "500px"
    assert w.layout.height == "500px"
    w.width = "50%"
    assert w.layout.width == "50%"


def test_pipe_chain_five_widgets():
    """Five widgets piped in a chain propagate data end-to-end."""
    w1 = Frame()
    w2 = Frame()
    w3 = Frame()
    w4 = Frame()
    w5 = Frame()

    w1.pipe_to(w2, output_key="data")
    w2.pipe_to(w3, output_key="data")
    w3.pipe_to(w4, output_key="data")
    w4.pipe_to(w5, output_key="data")

    # Simulate w1 producing output
    w1.outputs = {"data": [1, 2, 3]}
    assert w2.inputs == {"data": [1, 2, 3]}

    # Simulate w2 producing output
    w2.outputs = {"data": [2, 4, 6]}
    assert w3.inputs == {"data": [2, 4, 6]}

    # Simulate w3 producing output
    w3.outputs = {"data": [6, 12, 18]}
    assert w4.inputs == {"data": [6, 12, 18]}

    # Simulate w4 producing output
    w4.outputs = {"data": [16, 22, 28]}
    assert w5.inputs == {"data": [16, 22, 28]}


# --- the rename (0.4.0: metaframe-widget/MetaframeWidget -> framejs/Frame) ----


def test_metaframe_widget_alias_is_the_same_class():
    """`MetaframeWidget` is an ALIAS, not a subclass.

    Old notebooks keep working, and a widget built under either name pipes to,
    and isinstance-checks against, the other.
    """
    from framejs import MetaframeWidget

    assert MetaframeWidget is Frame

    source = MetaframeWidget()
    sink = Frame()
    assert isinstance(source, Frame)
    source.pipe_to(sink, output_key="x")
    source.outputs = {"x": 1}
    assert sink.inputs == {"x": 1}


def test_package_exports():
    import framejs

    assert sorted(framejs.__all__) == ["Frame", "MetaframeWidget", "runtime_url"]


# --- framejs.app -> framejs.io normalisation ---------------------------------
# A notebook must load the RUNTIME (framejs.io), not the account layer: only
# framejs.io serves /j/<id>/metaframe.json with CORS headers, and the metapage
# client fetches that before it renders anything. Pasting the framejs.app URL —
# which is the one the share panel hands out — otherwise fails with a bare CORS
# error and no widget.

import pytest

from framejs import runtime_url


@pytest.mark.parametrize(
    "given,expected",
    [
        # the case from the bug report
        (
            "https://framejs.app/j/019f61392e0778f8aba8dd7ffe35a83c",
            "https://framejs.io/j/019f61392e0778f8aba8dd7ffe35a83c",
        ),
        # a pinned version and hash inputs must survive the swap
        (
            "https://framejs.app/j/abc?v=deadbeef#?inputs=eyJhIjoxfQ==",
            "https://framejs.io/j/abc?v=deadbeef#?inputs=eyJhIjoxfQ==",
        ),
        ("https://www.framejs.app/j/abc", "https://framejs.io/j/abc"),
        ("https://FrameJS.App/j/abc", "https://framejs.io/j/abc"),
    ],
)
def test_app_frame_urls_are_mapped_to_the_runtime(given, expected):
    assert runtime_url(given) == expected


@pytest.mark.parametrize(
    "url",
    [
        "",
        # already the runtime
        "https://framejs.io/j/abc",
        # a full inline-code URL has no /j/ path
        "https://framejs.io/#?js=YWxwaGE=",
        # not a frame route: /f/ is the file endpoint
        "https://framejs.app/f/abc",
        "https://framejs.app/dashboard",
        # must not be fooled by a lookalike host
        "https://framejs.app.evil.com/j/abc",
        "https://notframejs.app/j/abc",
        # a local dev stack has no framejs.io counterpart we could name
        "https://framejs-app.localhost:13829/j/abc",
    ],
)
def test_other_urls_are_left_alone(url):
    assert runtime_url(url) == url


def test_widget_exposes_both_the_given_and_the_runtime_url():
    app = "https://framejs.app/j/019f61392e0778f8aba8dd7ffe35a83c"
    io = "https://framejs.io/j/019f61392e0778f8aba8dd7ffe35a83c"

    w = Frame(url=app)
    # What the caller passed is read back unchanged...
    assert w.url == app
    # ...while the iframe loads the runtime.
    assert w._runtime_url == io
    # The ESM needs it over the wire, or it falls back to the CORS-blocked URL.
    assert "_runtime_url" in w.keys

    # It tracks later assignments too.
    w.url = "https://framejs.app/j/other"
    assert w._runtime_url == "https://framejs.io/j/other"
    w.url = "https://framejs.io/#?js=YWxwaGE="
    assert w._runtime_url == w.url
