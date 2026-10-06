# metaframe-widget → renamed to [`framejs`](https://pypi.org/project/framejs/)

This package is no longer developed. It installs
[`framejs`](https://pypi.org/project/framejs/) and re-exports it, so existing
code keeps working.

```bash
pip install framejs
```

```python
from framejs import Frame

w = Frame(url="https://framejs.app/j/<uuid>")
w
```

`MetaframeWidget` is still exported from `framejs` as an alias of `Frame`, so
the old class name keeps working too.

Docs: <https://framejs.io/docs/integrations/jupyter>
