# Claude Connector (MCP)

framejs runs a hosted [MCP](https://modelcontextprotocol.io) server that lets
**Claude create, edit, and find your framejs visualizations directly in a
conversation** — a chart, dashboard, animation, or small app, returned as a
shareable link you can open.

It works in the Claude apps — **web ([claude.ai](https://claude.ai)), desktop,
and mobile** — with **no install and no shell**. This is the complement to the
[Agent Skill](../guide/ai): the skill runs in shell-capable coding agents (Claude
Code, Cursor, …) and can work with local files; the connector runs in the Claude
apps and works with the frames saved to your account.

| | [Agent Skill](../guide/ai) | Claude Connector (MCP) |
|---|---|---|
| Where | Coding agents with a shell | Claude web / desktop / mobile |
| Install | One-line skill install | Add a connector URL, once |
| Account | Not required (anonymous frames) | Sign in with your framejs account |
| Local files | Yes | No (inline the data or use a URL) |

The connector is entirely optional — nothing else depends on it, and the skill
and manual flows keep working without it.

## Add the connector

In Claude, open **Settings → Connectors → Add custom connector** and enter:

```
https://framejs.app/mcp
```

Then **Connect**. Claude sends you to framejs to sign in (or create a free
account) and approve access — there is **no client ID or secret to paste**. Once
approved, the framejs tools are available in your conversations.

::: tip Requires a free framejs account
The connector reads and edits the frames saved to *your* account, so it signs you
in. Anonymous/one-off frames don't need an account — use the
[Agent Skill](../guide/ai) or the [editor](https://framejs.io) for those.
:::

## Use it

Just describe what you want:

```
Create a bar chart of last quarter's sales: Q1 120, Q2 150, Q3 90, Q4 210
```

```
Find my sine wave plot and make the line crimson
```

Claude writes the browser JavaScript, saves it as a frame, and replies with its
`https://framejs.app/j/<id>` link to open. Editing appends a new version, so
changes are undoable and the link never changes.

You can also invoke the connector's ready-made **prompts** from Claude's prompt
menu:

- **Create a visualization or app**
- **Edit one of my frames**
- **Find one of my frames**

## What it can do

The connector exposes these tools; Claude picks the right one for your request:

| Tool | What it does |
|------|--------------|
| `create_frame` | Create a new visualization/app from JavaScript, return its link |
| `update_frame` | Edit an existing frame (appends a version) |
| `get_frame` | Read a frame's current code before editing it |
| `list_frames` | List your frames, newest first |
| `search_frames` | Find a frame by its title/description |
| `framejs_guide` | The browser-JavaScript authoring rules Claude follows |

## Access & privacy

- Claude acts **as you**: it can only see and change frames you own, enforced by
  the same permissions as the website — not by the connector.
- Sign-in uses OAuth; you approve access on the framejs consent screen.
- Disconnect any time from Claude's connector settings; that revokes access.

## Other AI options

- [Agent Skill](../guide/ai) — for coding agents with a shell, and local files.
- [AI Usage](../guide/ai) — copy/paste prompts, the LLM API, and `llms-prompt.md`.
