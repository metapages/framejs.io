# Quickstart

1. [Install](./guide/ai)

```bash
curl -fsSL https://framejs.io/skill/install.sh | sh
```


2. AI chat (e.g.Claude Code):


<div class="wrap-code">

```bash
> create an interactive 3D globe visualization that highlights countries on hover with population and fertility, when none are selected use the global values
```

</div>

::: warning Tip:
You can reference local files, and combine with other skills
:::

3. Result automatically opens in the browser

<BrowserFrame
  url="https://framejs.io/j/019f2b40f2a97d68a14ae3d997e37de4"
  :height="500"
/>

4. Edit an **existing** URL in AI chat:


::: warning Note:
This only works in the framejs.app site, **not** the framejs.io renderer, as it needs a persistent URL to post updates
:::

`framejs.app/j/<uuid>` -> `Menu` (right) -> `Copy URL for AI Session`

<img
  src="https://framejs.app/share/copy-url-screenshot.png"
  alt="Copy URL for AI session"
  style="max-width: 300px;"
/>

Paste into an AI chat session, and tell the AI the changes you want:

<div class="wrap-code">

```bash
> https://framejs.app/j/xxx?token=yyy
render an interactive 3d surface plot visualization
```

</div>

