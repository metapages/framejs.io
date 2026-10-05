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


# --- the 0.4.0 rename (metaframe-widget/MetaframeWidget -> framejs/Frame) -----
# This tier is what `just test` runs, so the alias is guarded where CI can see it.


def test_metaframe_widget_alias_is_the_same_class():
    """`MetaframeWidget` is an ALIAS of `Frame`, not a subclass.

    Notebooks written before the rename keep working, and widgets built under
    either name pipe to each other.
    """
    from framejs import MetaframeWidget

    assert MetaframeWidget is Frame

    source = MetaframeWidget(url="https://framejs.io/#?js=abc")
    sink = Frame()
    assert isinstance(source, Frame)
    source.pipe_to(sink, output_key="x")
    source.outputs = {"x": 1}
    assert sink.inputs == {"x": 1}


# --- framejs.app -> framejs.io normalisation ---------------------------------
# Only framejs.io serves /j/<id>/metaframe.json with CORS headers, and the
# metapage client fetches it before rendering — so a framejs.app URL (the one
# the share panel hands out) must be mapped, or a local notebook gets a CORS
# error and a blank widget. The browser proof is in test_browser.py; this is the
# cheap guard that runs with no network.


def test_app_frame_url_is_mapped_to_the_runtime():
    from framejs import runtime_url

    assert (
        runtime_url("https://framejs.app/j/abc?v=1#?inputs=eyJhIjoxfQ==")
        == "https://framejs.io/j/abc?v=1#?inputs=eyJhIjoxfQ=="
    )
    # Not a framejs.app /j/ URL: left exactly as given.
    for untouched in (
        "https://framejs.io/j/abc",
        "https://framejs.io/#?js=YWxwaGE=",
        "https://framejs.app/f/abc",
        "https://framejs.app.evil.com/j/abc",
    ):
        assert runtime_url(untouched) == untouched


def test_widget_keeps_the_given_url_and_derives_the_runtime_one():
    w = Frame(url="https://framejs.app/j/abc")
    assert w.url == "https://framejs.app/j/abc"
    assert w._runtime_url == "https://framejs.io/j/abc"
    assert "_runtime_url" in w.keys  # must reach the ESM over the wire
