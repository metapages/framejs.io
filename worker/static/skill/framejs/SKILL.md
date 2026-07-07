---
name: framejs
description: "Create, modify, and share interactive browser apps and visualizations from JavaScript via framejs.io. The app is encoded into a shareable URL that runs instantly — no build, server, or account. Use when the user wants a chart, graph, plot, dashboard, animation, simulation, creative coding sketch, data visualization, or small interactive web tool; when they reference a framejs.io short URL (/j/<sha256>) to modify; or when they want to visualize a local data file (CSV, JSON, image, etc.)."
license: MIT
metadata:
  author: metapages
  homepage: https://framejs.io
  version: "1.5"
---

# framejs

framejs runs an ES6 JavaScript module in the browser. A **frame** is the app: it
lives at a stable, shareable `framejs.app/j/<uuid>` URL whose content is mutable
— you update the app in place by POSTing its hash params. Your job: turn the
user's request into that browser JavaScript and deliver it the right way for
your environment.

## Pick your delivery mode

Choose based on what you can do — not on the request:

- **Automation mode — you can run a shell / `node`:** generate the JavaScript,
  then create-or-update the session's framejs.app frame, **print its `/j/<uuid>`
  URL**, and open it in the browser. This is the default whenever a shell is
  available.
- **Code-block mode — chat / API only, no shell:** respond with **only** a
  single fenced JavaScript code block (open it with a `javascript` info string)
  and nothing else — no surrounding prose, no files, no URLs. The user pastes it
  into the editor at framejs.io.

In both modes the JavaScript you write follows the same rules — read
[references/coding-guide.md](references/coding-guide.md).

## What the request can be

1. **Create from a prompt** — "a bouncing ball animation", "plot y = sin(x)".
2. **Modify an existing app** — the request contains a frame URL
   (`https://framejs.app/j/<uuid>`) or a bare 32-char hex id (or a legacy
   `https://framejs.io/j/<sha256>` / 64-char id). Whenever you see a framejs
   URL, extract the uuid from its `/j/<uuid>` path and target THAT frame (pass
   the URL straight to `--id`). You MUST fetch the existing code first and
   modify it — see [references/short-url-api.md](references/short-url-api.md) (§
   Modify). If the URL carries a `?token=<key>` query param (from the app's
   "Copy frame for AI session" action), pass the whole URL to `--id` (or the key
   to `--token`): the helper stores it and sends it as the bearer credential so
   your updates keep working even after the frame's owner has claimed it.
   Passing the **whole URL** also targets the backend the URL names — so a dev
   or self-hosted frame URL (e.g.
   `https://framejs-app.localhost:13747/j/<uuid>?token=<key>`) updates its own
   stack with no env preconfigured. `--app-origin <url>` / `--io-origin <url>`
   set the backend explicitly. See
   [references/short-url-api.md](references/short-url-api.md) (§ Local / dev
   origins).
3. **Visualize local files** — the request references file paths (`./data.csv`,
   `/tmp/results.json`). Upload them and pass as inputs — see
   [references/file-inputs.md](references/file-inputs.md).

## Automation mode — how to deliver

Generate the code, then use the bundled helper (preferred) or the inline-node
fallback in [references/short-url-api.md](references/short-url-api.md):

```bash
cat << 'JSCODE' | node scripts/framejs.mjs create --state "${SCRATCHPAD}/framejs-frame.json" --title "<short title>" --description "<one-sentence summary>" --screenshot
// your generated browser JS here — $vars, backticks, all special chars are safe inside the heredoc
JSCODE
```

The helper prints (on stdout) two URLs — the primary
`https://framejs.app/j/<uuid>` page URL and an immutable `snapshot:`
`https://framejs.io/j/<sha256>` URL. It also prints (on stderr) a **share-link
lifecycle notice you MUST relay to the user**:

- the **`/j/<uuid>` page** is editable and live-updating, but an **anonymous
  (unclaimed) frame is temporary and will expire** — tell the user to open it
  and **claim it** (free account) to keep it permanently;
- the **`/j/<sha256>` snapshot** is an **immutable** copy of the current app
  that **expires ~30 days after it is last opened** — a good stable share/backup
  link, but it never reflects later edits.

Add `--module <url>` for classic scripts and `--input name=value` for inputs.

**One frame per session, updated in place.** Always pass
`--state "<path in your scratchpad>/framejs-frame.json"` (any writable file
path). The first `create` mints the frame; **re-run `create` with the same
`--state` to UPDATE the same frame** — the `/j/<uuid>` URL stays constant and
any open framejs.app page updates live, so give the URL to the user once. Only
when the user wants a **separate** app in the same session, add `--new` to start
a fresh frame (subsequent updates then target that new one). To update one
specific frame regardless of state, pass `--id <uuid>`. On such an in-place
update the helper **carries the frame's existing Open Graph data forward
automatically** when you pass no `--og`/`--title`/`--description`, so a bare
re-run never drops the title/description (and the retained `og.image` skips a
redundant re-screenshot). Pass `--title`/`--description` again only to _change_
the preview copy.

The browser opens automatically only the first time a frame is minted
(`--no-open` to skip even that). A later update to the same frame — same
`--state`, or an explicit `--id` — does NOT reopen the browser: the page already
open reaches it live through the same-frame subscription, so opening again would
just spawn a redundant new tab.

If a local dev checkout is present, the helper auto-loads its `.env` and targets
the dev stacks (`FRAMEJS_APP_ORIGIN` / `FRAMEJS_IO_ORIGIN`) instead of
production — no action needed on your part.

If the helper prints an `out of date` update notice (on stderr, at most hourly),
relay it to the user verbatim once — their installed skill is behind the latest
and the notice tells them the one command to update it.

Always pass `--screenshot`: the helper renders the finished app and stores the
capture as the `og:image` preview. It is self-guarding — it captures ONLY when
the app has no `og.image` yet, so it never overwrites an image a previous run
(or the user) already set, and it silently falls back to the image-less URL if
no renderer is available. Capture prefers **Playwright** when it can be imported
(true network-idle waiting — best for apps that fetch inputs), and otherwise
uses **system headless Chrome**. Playwright is optional: install it
(`npm i -g
playwright && npx playwright install chromium`) for the more reliable
path, or point `$FRAMEJS_PLAYWRIGHT` at a dir whose `node_modules` has it. Tune
with `--screenshot-wait <ms>` (default 6000 — raise it for apps that load
slowly) and `--screenshot-size <w,h>` (default `1200,630`). Override the Chrome
binary with `$CHROME_PATH`.

`scripts/framejs.mjs` is resolved **relative to this skill's directory**, not
your current working directory — run it from the skill folder, or use its
absolute path (Claude Code exposes that directory as `${CLAUDE_SKILL_DIR}`, so
`${CLAUDE_SKILL_DIR}/scripts/framejs.mjs` always works). If you cannot locate or
run the bundled helper, use the inline-node fallback in
[references/short-url-api.md](references/short-url-api.md) — it needs no script
file.

Always include Open Graph preview tags so the link unfurls nicely when shared —
see the OG rules in [references/short-url-api.md](references/short-url-api.md):

- **New app:** derive fresh copy with `--title` / `--description`, and pass
  `--screenshot` to capture the preview image.
- **Modifying an existing app:** the fetched app already carries `og` (the
  `fetch` command returns it). Do NOT recalculate it — pass the fetched object
  straight back through with `--og '<the fetched og JSON>'`, which preserves
  every field (including `image`). Update the SAME frame with `--id <uuid>` (or
  the same `--state`). Only set new `--title`/`--description` if the user
  explicitly asked to change the preview copy. You can still pass
  `--screenshot`: if the fetched `og` already has an `image` it is left
  untouched; if it has none, a fresh capture is added.

## Absolute rules (both modes)

- Browser JavaScript only — it runs in an iframe, NOT Node.js.
- MUST use ES6 module syntax: `export function onInputs(inputs) {}`.
- NEVER create HTML files. NEVER write local `.js` files. NEVER use your own
  visualization/rendering/widget tools to render the result.
- NEVER modify `root.style.position`, `root.style.height`, or
  `root.style.width`.
- **IMPORTANT: the visualization MUST look good on mobile and adapt to that
  screen size** — use responsive sizing (read `root`'s dimensions / listen for
  resize), avoid fixed pixel widths that overflow, keep text and touch targets
  legible on small screens.
- In automation mode, NEVER output a code block for the user to copy and NEVER
  hand-build a long hash URL as the deliverable — always POST through the frame
  API (the helper's `create`). Give the user the `/j/<uuid>` page URL.
- In code-block mode, output ONLY the single fenced JavaScript code block —
  nothing else.

## References

- [references/coding-guide.md](references/coding-guide.md) — globals, exports,
  patterns, CDN libraries, common mistakes.
- [references/short-url-api.md](references/short-url-api.md) — create/update a
  frame (`POST /j/<uuid>.json`), one-frame-per-session state, Open Graph tags,
  API tokens (keep updating after a frame is claimed), inline fallbacks.
- [references/file-inputs.md](references/file-inputs.md) — upload local files
  and wire them in as inputs.
- `scripts/framejs.mjs` — Node helper: `create` (stdin JS → framejs.app frame),
  `fetch <id>`, `upload <path>`. Origins: `FRAMEJS_APP_ORIGIN` /
  `FRAMEJS_IO_ORIGIN` (auto-loaded from a nearby `.env` in local dev), or
  per-run via `--app-origin`/`--io-origin` or the origin of a full frame URL
  passed to `--id`/`fetch`.
