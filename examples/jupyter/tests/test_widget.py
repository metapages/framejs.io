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
