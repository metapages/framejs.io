# Embedding

Since all code and state is stored in the URL, metaframe-js widgets can be embedded into any application that supports URL embeds.

## Supported platforms

Any tool that lets you embed a URL or iframe works with metaframe-js:

- **Notion** — use the `/embed` block and paste your `framejs.io` URL
- **Obsidian** — use an iframe in a markdown note: `<iframe src="https://framejs.io/..."></iframe>`
- **Confluence**, **Coda**, **Google Docs** — use their respective embed or iframe widgets
- **Any note-taking or wiki tool** — if it supports URL or iframe embeds, it works

## How to embed

1. Create your widget at [framejs.io](https://framejs.io)
2. Copy the URL from the address bar
3. Paste it into your platform's embed block or iframe

The embedded widget is fully interactive — users can see and interact with the output. The URL contains all the code, so there is nothing else to configure.

## Open Graph (link previews)

When you paste a link, many apps (chat, social, docs) fetch the page and read metadata defined by the [Open Graph protocol](https://ogp.me/) to show a title, description, and image nicely formatted. `framejs.io` supports this:

[![](./open-graph-embed.png)](https://framejs.io/j/69a1461a7ec981c3d215b8c7ce69ae7037012677c3257be4a904ecb503ddba77)

In the editor, open **Settings** and use the **Open Graph** section to set an optional **title**, **description**, **tags** (type a topic and press Enter; click the × on a tag to remove it), and **preview image** (upload an image file; its URL is stored with the widget). That data is saved in the `og` hash parameter with the rest of the state, with the tags as a JSON array of strings.

For **short URLs** (`/j/...` from [short URLs](./short-urls)), the server injects `og:title`, `og:description`, `og:image`, and one `article:tag` per tag into the HTML response, so crawlers can render a rich preview without running JavaScript. Those pages declare `og:type` as `article`, the Open Graph vertical that `article:tag` belongs to. Long URLs that keep everything in the hash are less predictable for previews, because fragments are often not sent to the server. If you care how the link looks when shared, shorten the URL and fill in Open Graph fields first.

::: tip
Use [short URLs](./short-urls) if the full URL is too long for your platform's embed input.
:::
