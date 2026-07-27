# Quickstart

<YouTube id="7brz6Z111Eo" vertical title="framejs.io in 1 minute" />

There are two ways to drive framejs with AI. Pick the one that matches where you
already work — you don't need both.

| | [**Claude apps**](#a-claude-desktop-web-mobile) | [**Coding agent**](#b-coding-agents-with-a-shell) |
|---|---|---|
| Where | Claude Desktop, [claude.ai](https://claude.ai), mobile | Claude Code, Cursor, Gemini CLI, … |
| Setup | Paste one URL, once | One-line install |
| Terminal | Not needed | Required |
| Local files | No — paste data or a URL | Yes |
| Account | Free framejs account | Not required |

## A. Claude Desktop / web / mobile

**No install, no terminal.** framejs runs a hosted
[MCP](https://modelcontextprotocol.io) connector, so Claude can create and edit
your frames right in the conversation.

1. In Claude, open **Settings → Connectors → Add custom connector**
2. Paste the URL:

```
https://framejs.app/mcp
```

3. Click **Connect**, sign in to framejs (free account), and **Allow**.
4. Ask for anything:

<div class="wrap-code">

```
create an interactive 3D globe that highlights countries on hover with population and fertility
```

</div>

Claude writes the JavaScript, saves it, and replies with a
`https://framejs.app/j/<id>` link. Editing it later appends a version — the link
never changes.

<p class="feature-link"><a href="/docs/integrations/claude-mcp">Full connector guide &rarr;</a></p>

::: tip Also works in Claude Code
Same connector, one command: `claude mcp add --transport http framejs
https://framejs.app/mcp`, then `/mcp` to sign in.
:::

## B. Coding agents with a shell

**Install the [Agent Skill](./guide/ai)** — works across ~40 harnesses (Claude
Code, Cursor, Gemini CLI, opencode, Codex, …). The agent can read your local
files, so you can point it at data on disk.

1. Install:

```bash
curl -fsSL https://framejs.io/skill/install.sh | sh
```

2. Prompt your agent:

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

## No AI at all

Open the [editor](https://framejs.io/#?edit=true), write JavaScript, and the URL
updates as you type. See the [JavaScript API](./guide/javascript-api).

<style>
.feature-link a {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}
</style>
