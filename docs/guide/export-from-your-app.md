# Export from Your App

Give your own web app, CLI, notebook or generated HTML page an **Open in
framejs** button: one click turns what it is showing into a shareable
`framejs.app/j/<id>` link that runs in any browser and
[embeds anywhere](./embedding).

## Hand this to your coding agent

Paste this into Claude Code, Cursor, Codex or any coding agent, working in your
project. Fill in the two `<…>` lines; the linked file has everything else the
agent needs.

```text
Add an "Open in framejs" export to this project, so it
can turn what it is showing into a shareable framejs link.

Follow exactly (and the coding guide it links to):
https://framejs.io/skill/framejs/references/export-from-your-app.md

Where the export goes: <e.g. a button in the viewer's
menu / a --share flag on the CLI / a button in the
generated HTML page>
How the frame loads our rendering code: <from our
published package at <CDN URL, pinned to a version> /
inlined from the page's own bundle>

When you are done, run the export yourself, open the
link it produced, and confirm the view renders with the
same data.
```

Agents with the [framejs skill](./ai) installed already know this recipe; the
prompt still tells them what you want and where.

## How it works

1. Your app builds a **frame**: an ES module (`js`) that loads your rendering
   code and draws into the page, plus the data (`inputs`) and a link preview
   (`og`).
2. It sends that to framejs with one `POST https://framejs.io/api/frame` — no
   account, no API key, CORS open — and gets back the `framejs.app/j/<id>` URL.
3. It opens or prints the URL.

The same request works from every kind of tool:

| Your tool            | Where the export lives                     | The frame's code                  |
| -------------------- | ------------------------------------------ | --------------------------------- |
| Web app or site      | A button; `fetch` from the page            | Your published bundle from a CDN  |
| CLI or server        | A command or flag; prints the URL          | Your published bundle, or inlined |
| Standalone HTML page | A button in the page, works from `file://` | The page's own inlined bundle     |

The link is anonymous until someone claims it: unclaimed frames expire, so the
export should say so and point the user at claiming it with a free account (see
[Persistence & Retention](./persistence)).

## A real example

[alchemy-viz](https://github.com/omsf/alchemy-viz) draws molecules and networks
in web pages, notebooks and standalone HTML files its CLI writes. Every view's
menu has a **Share to the web** entry
([`ts/src/shared/framejs.ts`](https://github.com/omsf/alchemy-viz/blob/main/ts/src/shared/framejs.ts))
that takes the page's own bundle and payload, wraps them as a frame and opens
the framejs link — the "inlined" row of the table above.

## Reference

- [`export-from-your-app.md`](https://framejs.io/skill/framejs/references/export-from-your-app.md)
  — the full recipe the prompt points at: building the module, the request and
  response, updating a frame, snapshots, and what to test.
- [Frame API](https://framejs.io/skill/framejs/references/short-url-api.md) —
  every field a frame can carry, and API tokens for updating a claimed frame.
- [Rendering in a Website](./rendering) — the other direction: show a framejs
  frame inside your page and pass data in and out.
