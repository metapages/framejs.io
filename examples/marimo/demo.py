import marimo

__generated_with = "0.9.0"
app = marimo.App(width="medium")


@app.cell
def __():
    import marimo as mo
    from metaframe_widget import MetaframeWidget
    return MetaframeWidget, mo


@app.cell
def __(mo):
    mo.md("# Metaframe Widget in marimo")
    return


@app.cell
def __(mo):
    mo.md("## 1. Create a widget from a URL")
    return


@app.cell
def __(MetaframeWidget, mo):
    w = mo.ui.anywidget(MetaframeWidget(url="https://framejs.io/"))
    w
    return (w,)


@app.cell
def __(mo):
    mo.md("## 2. Create from a saved short URL")
    return


@app.cell
def __(MetaframeWidget, mo):
    # An "echo" metaframe (built in the framejs.io editor, saved to a short URL):
    # it displays its inputs and passes each input key through as an output.
    echo = mo.ui.anywidget(
        MetaframeWidget(
            url="https://framejs.io/j/02a32c151b660f3f1ab40685016710531d90757d658d34c19892dc9639e1eb06"
        )
    )
    echo
    return (echo,)


@app.cell
def __(mo):
    mo.md("## 3. Push inputs from Python")
    return


@app.cell
def __(echo):
    echo.set_inputs({"data": [1, 2, 3], "message": "hello from marimo"})
    return


@app.cell
def __(mo):
    mo.md("## 4. Read outputs (reactive — this cell re-runs when outputs change)")
    return


@app.cell
def __(echo):
    echo.outputs
    return


@app.cell
def __(mo):
    mo.md("## 5. Pipe five widgets together")
    return


@app.cell
def __(MetaframeWidget, mo):
    # Create all widgets upfront in one cell so they are never recreated.
    # Use pipe_to() for connections — traitlets observers forward outputs
    # to the next widget's inputs without triggering marimo cell re-runs.
    #
    # Each is a small metaframe built in the framejs.io editor and saved to a
    # short URL: echo, ×2, ×3, +10, negate. They all read `data` and emit `data`.

    w_echo = MetaframeWidget(
        url="https://framejs.io/j/dfe630a85ee3fe79477dd014c2f0dd4c0809789b4191c2e349a9e646d39ab05c",
        height="80px",
    )

    w_double = MetaframeWidget(
        url="https://framejs.io/j/34a34096d19657ddf8bd3fffc7fbe3d5c5a5f78bb859933444dc7d1294ea43cc",
        height="80px",
    )

    w_triple = MetaframeWidget(
        url="https://framejs.io/j/e5f3aa35963947b06cf7b85a80eb4b7349aa276723f00a2676a416bd4f9eca82",
        height="80px",
    )

    w_add10 = MetaframeWidget(
        url="https://framejs.io/j/219cb848c008cddf70ef1c48e9c7568b067bef10fc04a16b773a478028d75542",
        height="80px",
    )

    w_negate = MetaframeWidget(
        url="https://framejs.io/j/09d743eb536bbe8c13592db795ec1889252018c3d2ba8c29ae63f30f9d4e5d19",
        height="80px",
    )

    # Chain: echo → double → triple → add10 → negate
    w_echo.pipe_to(w_double, "data")
    w_double.pipe_to(w_triple, "data")
    w_triple.pipe_to(w_add10, "data")
    w_add10.pipe_to(w_negate, "data")

    pipe_echo = mo.ui.anywidget(w_echo)
    mo.vstack([
        pipe_echo,
        mo.ui.anywidget(w_double),
        mo.ui.anywidget(w_triple),
        mo.ui.anywidget(w_add10),
        mo.ui.anywidget(w_negate),
    ])
    return (pipe_echo,)


@app.cell
def __(pipe_echo):
    # Push data through the 5-widget pipeline: [1,2,3] → ×2 → ×3 → +10 → negate
    pipe_echo.set_inputs({"data": [1, 2, 3]})
    return


@app.cell
def __(pipe_echo):
    pipe_echo.outputs
    return


if __name__ == "__main__":
    app.run()
