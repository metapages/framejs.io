from metaframe_widget import MetaframeWidget


def test_create_widget():
    w = MetaframeWidget(url="https://framejs.io/#?js=abc")
    assert w.url == "https://framejs.io/#?js=abc"
    assert w.inputs == {}
    assert w.outputs == {}
    assert w.height == "400px"


def test_set_inputs():
    w = MetaframeWidget()
    w.set_inputs({"a": 1, "b": 2})
    assert w.inputs == {"a": 1, "b": 2}
    w.set_inputs({"b": 3, "c": 4})
    assert w.inputs == {"a": 1, "b": 3, "c": 4}


def test_set_input():
    w = MetaframeWidget()
    w.set_input("x", 42)
    assert w.inputs == {"x": 42}
    w.set_input("y", "hello")
    assert w.inputs == {"x": 42, "y": "hello"}


def test_on_outputs_change():
    w = MetaframeWidget()
    changes = []
    w.on_outputs_change(lambda change: changes.append(change))
    w.outputs = {"key": "value"}
    assert len(changes) == 1
    assert changes[0]["new"] == {"key": "value"}


def test_pipe_to():
    source = MetaframeWidget()
    sink = MetaframeWidget()
    source.pipe_to(sink, output_key="doubled", input_key="data")
    source.outputs = {"doubled": [2, 4, 6]}
    assert sink.inputs == {"data": [2, 4, 6]}


def test_pipe_to_default_key():
    source = MetaframeWidget()
    sink = MetaframeWidget()
    source.pipe_to(sink, output_key="result")
    source.outputs = {"result": 42}
    assert sink.inputs == {"result": 42}


def test_pipe_to_ignores_unrelated_keys():
    source = MetaframeWidget()
    sink = MetaframeWidget()
    source.pipe_to(sink, output_key="x")
    source.outputs = {"y": 99}
    assert sink.inputs == {}


def test_layout_height_synced_on_init():
    """layout.height must match the height trait so ipywidgets doesn't clear it."""
    w = MetaframeWidget()
    assert w.layout.height == "400px"
    assert w.layout.width == "100%"


def test_layout_height_synced_with_custom_value():
    w = MetaframeWidget(height="600px", width="80%")
    assert w.layout.height == "600px"
    assert w.layout.width == "80%"


def test_layout_height_updates_on_change():
    """Changing height trait after init must propagate to layout."""
    w = MetaframeWidget()
    w.height = "500px"
    assert w.layout.height == "500px"
    w.width = "50%"
    assert w.layout.width == "50%"


def test_pipe_chain_five_widgets():
    """Five widgets piped in a chain propagate data end-to-end."""
    w1 = MetaframeWidget()
    w2 = MetaframeWidget()
    w3 = MetaframeWidget()
    w4 = MetaframeWidget()
    w5 = MetaframeWidget()

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
