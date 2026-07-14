# AI Usage and Installation

## Create and edit in AI chat

Simply describe what you want, referencing local files or anything accessible to the agent. Other skills can be combined

```bash
> visualize this data in this directory
```
<BrowserFrame
  url="https://framejs.io/j/019f3ad1d064783582418a59243d419e"
  :height="500"
/>


## Install the `framejs` Agent Skill (recommended)

### One line Install

Installs the framejs [skill](#notes):

```bash
# default install for claude
curl -fsSL https://framejs.io/skill/install.sh | sh
```

```bash
# or target another harness — pass its skills directory (see the table below):
curl -fsSL https://framejs.io/skill/install.sh | sh -s -- <SKILLS_DIR>
```

Re-run any time to update. Prefer to do it by hand? [Unpack the bundle yourself](#unpack-the-bundle-yourself):

framejs.io ships an [Agent Skill](https://agentskills.io) — a portable `SKILL.md`
folder that works across ~40 agent harnesses (Claude Code, Gemini CLI, Cursor,
opencode, Goose, OpenAI Codex, pi, and more). 


| Harness | Skills directory | Notes |
|---------|------------------|-------|
| Claude Code | `~/.claude/skills/` (personal) or `<project>/.claude/skills/` | [docs](https://code.claude.com/docs/en/skills) |
| Cursor | `~/.cursor/skills/` or `<project>/.cursor/skills/` | [docs](https://cursor.com/docs/context/skills) |
| Gemini CLI | per Gemini CLI config | [docs](https://geminicli.com/docs/cli/skills/) |
| opencode | per opencode config | [docs](https://opencode.ai/docs/skills/) |
| Goose | per Goose config | [docs](https://block.github.io/goose/docs/guides/context-engineering/using-skills/) |
| OpenAI Codex | per Codex config | [docs](https://developers.openai.com/codex/skills/) |
| pi | prompt-template / skills config | [docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md) |

Other harnesses: see the [Agent Skills client list](https://agentskills.io/clients)
for each tool's skills directory, then point the one-liner at it.

### Use it

Once installed, just describe what you want — the agent activates the skill when
the task matches (a chart, plot, dashboard, animation, simulation, or visualizing
a data file):

```
make a bouncing ball animation
```

```
visualize ./data.csv as a bar chart
```

Modify an existing app by pasting its short URL
 - `framejs.app`: (top right `Menu -> Copy frame for AI session`)
 - `framejs.io`: `Create expiring snapshot`

```
https://framejs.io/j/<id> make the background white
```

## Using an AI chat interface via copy/pasting code

From the component page:

1. `Edit (top right) -> Copy button` to copy the AI prompt
2. Paste into Claude, ChatGPT, or any LLM chat interface
3. Describe what you want
4. Copy the generated JavaScript back into the editor

![Copy AI prompt](/readme-images/js-copy-ai.gif "Copy prompt and code for AI")

## From an AI API

Give the LLM the URL
[`https://framejs.io/llms-prompt.md`](https://framejs.io/llms-prompt.md) along
with your request. The LLM responds with a JavaScript code block that you paste
into the editor at [framejs.io](https://framejs.io).

## URL encoding format

The JavaScript is encoded into the URL hash using this scheme:

```
encodeURIComponent(code) → base64 → URL hash parameter
```

In JavaScript:

```js
const encoded = btoa(encodeURIComponent(code));
const url = `https://framejs.io/#?js=${encoded}`;
```

For shareable links, prefer the short-URL API
(`POST https://framejs.io/api/shorten/json`) over long hash URLs — see the
[skill's short-URL reference](https://framejs.io/skill/framejs/references/short-url-api.md).

## How it works

A shell-capable agent will:

1. Generate the browser JavaScript.
2. Create a short URL via `POST https://framejs.io/api/shorten/json` (the server
   handles encoding) and print the resulting `https://framejs.io/j/<sha256>`.
3. Open it in your browser.

No local files are written — the short URL is standalone and shareable. Every
update creates a new short URL.

## LLM integration files

All of these are generated from the single source of truth, the `framejs` skill
at `worker/static/skill/framejs/`, so they never drift:

| File | Purpose |
|------|---------|
| [`/skill/framejs/SKILL.md`](https://framejs.io/skill/framejs/SKILL.md) | Portable Agent Skill — combines all use cases, auto-routes by capability |
| [`/llms-prompt.md`](https://framejs.io/llms-prompt.md) | AI chat / API — outputs a JavaScript code block |
| [`/llms-claude-code.txt`](https://framejs.io/llms-claude-code.txt) | CLI integration guide (short URLs, file uploads, coding guide) |
| [`/skill/framejs.tar.gz`](https://framejs.io/skill/framejs.tar.gz) | Skill bundle |

## Notes

A skill is just a `framejs/` folder containing `SKILL.md`. Drop it into your
harness's skills directory.

### Unpack the bundle yourself

```bash
mkdir -p <SKILLS_DIR> && curl -fsSL https://framejs.io/skill/framejs.tar.gz | tar xz -C <SKILLS_DIR>
```