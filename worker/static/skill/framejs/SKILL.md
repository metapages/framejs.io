---
name: framejs
description: "Create, modify, and share interactive browser apps and visualizations from JavaScript via framejs.io. The app is encoded into a shareable URL that runs instantly — no build, server, or account. Use when the user wants a chart, graph, plot, dashboard, animation, simulation, creative coding sketch, data visualization, or small interactive web tool; when they reference a framejs.io short URL (/j/<sha256>) to modify; or when they want to visualize a local data file (CSV, JSON, image, etc.)."
license: MIT
metadata:
  author: metapages
  homepage: https://framejs.io
  version: "1.0"
---

# framejs

framejs.io runs an ES6 JavaScript module in the browser and encodes the whole
app into a shareable URL. Your job: turn the user's request into that browser
JavaScript and deliver it the right way for your environment.

## Pick your delivery mode

Choose based on what you can do — not on the request:

- **Automation mode — you can run a shell / `node`:** generate the JavaScript,
  then create a short URL via the framejs.io API, **print the short URL**, and
  open it in the browser. This is the default whenever a shell is available.
- **Code-block mode — chat / API only, no shell:** respond with **only** a
  single fenced JavaScript code block (open it with a `javascript` info string)
  and nothing else — no surrounding prose, no files, no URLs. The user pastes it
  into the editor at framejs.io.

In both modes the JavaScript you write follows the same rules — read
[references/coding-guide.md](references/coding-guide.md).

## What the request can be

1. **Create from a prompt** — "a bouncing ball animation", "plot y = sin(x)".
2. **Modify an existing app** — the request contains a short URL
   (`https://framejs.io/j/<sha256>`) or a bare 64-char hex id. You MUST fetch
   the existing code first and modify it — see
   [references/short-url-api.md](references/short-url-api.md) (§ Modify).
3. **Visualize local files** — the request references file paths (`./data.csv`,
   `/tmp/results.json`). Upload them and pass as inputs — see
   [references/file-inputs.md](references/file-inputs.md).

## Automation mode — how to deliver

Generate the code, then use the bundled helper (preferred) or the inline-node
fallback in [references/short-url-api.md](references/short-url-api.md):

```bash
cat << 'JSCODE' | node scripts/framejs.mjs create --title "<short title>" --description "<one-sentence summary>" --screenshot
// your generated browser JS here — $vars, backticks, all special chars are safe inside the heredoc
JSCODE
```

The helper prints the `https://framejs.io/j/<sha256>` short URL and opens the
browser (`--no-open` to skip). Re-run to create a NEW short URL on every update.
Add `--module <url>` for classic scripts and `--input name=value` for inputs.

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
  every field (including `image`). Only set new `--title`/`--description` if the
  user explicitly asked to change the preview copy. You can still pass
  `--screenshot`: if the fetched `og` already has an `image` it is left
  untouched; if it has none, a fresh capture is added.

## Absolute rules (both modes)

- Browser JavaScript only — it runs in an iframe, NOT Node.js.
- MUST use ES6 module syntax: `export function onInputs(inputs) {}`.
- NEVER create HTML files. NEVER write local `.js` files. NEVER use your own
  visualization/rendering/widget tools to render the result.
- NEVER modify `root.style.position`, `root.style.height`, or
  `root.style.width`.
- In automation mode, NEVER output a code block for the user to copy and NEVER
  build a long URL with the code in the hash — always use the short-URL API.
- In code-block mode, output ONLY the single fenced JavaScript code block —
  nothing else.

## References

- [references/coding-guide.md](references/coding-guide.md) — globals, exports,
  patterns, CDN libraries, common mistakes.
- [references/short-url-api.md](references/short-url-api.md) — create/modify a
  short URL, Open Graph tags, inline fallbacks.
- [references/file-inputs.md](references/file-inputs.md) — upload local files
  and wire them in as inputs.
- `scripts/framejs.mjs` — Node helper: `create` (stdin JS → short URL),
  `fetch <id>`, `upload <path>`. Override the host with `FRAMEJS_BASE`.
