# Use framejs in Claude (MCP Connector)

**Paste one URL into Claude, and Claude builds your visualizations.** No
install, no terminal, no API key, no client ID or secret — about 30 seconds,
once.

framejs runs a hosted [MCP](https://modelcontextprotocol.io) server that lets
**Claude create, edit, and find your framejs visualizations directly in a
conversation** — a chart, dashboard, animation, or small app, returned as a
shareable link you can open. It works in **Claude Desktop,
[claude.ai](https://claude.ai), and mobile**, and in **Claude Code**.

## Add the connector

::: tip The whole setup
Settings → Connectors → Add custom connector → paste `https://framejs.app/mcp` →
Connect → sign in → Allow.
:::

1. In Claude, open **Settings** → **Connectors**.
2. Click **Add custom connector**.
3. Give it a name (`framejs`) and paste the URL:

```
https://framejs.app/mcp
```

4. Click **Connect**. Claude sends you to framejs to sign in — or create a free
   account — and approve access. **There is no client ID or secret to paste**;
   leave the advanced/OAuth fields empty.
5. Approve on the framejs consent screen. The framejs tools are now available in
   your conversations.

### In Claude Code

The same connector, from the CLI:

```bash
claude mcp add --transport http framejs https://framejs.app/mcp
```

Then run `/mcp` in Claude Code and pick **framejs** to sign in. (If you want
local-file access and anonymous frames instead, use the
[Agent Skill](../guide/ai) — the two can coexist.)

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
menu (the `+` / attachment menu):

- **Create a visualization or app**
- **Edit one of my frames**
- **Find one of my frames**

## Connector or skill?

The connector is the complement to the [Agent Skill](../guide/ai): the skill runs
in shell-capable coding agents and can work with local files; the connector runs
in the Claude apps and works with the frames saved to your account.

| | Claude Connector (MCP) | [Agent Skill](../guide/ai) |
|---|---|---|
| Where | Claude web / desktop / mobile / Code | Coding agents with a shell |
| Install | Add a connector URL, once | One-line skill install |
| Account | Sign in with your framejs account | Not required (anonymous frames) |
| Local files | No (inline the data or use a URL) | Yes |
| Frames | Saved to your account, editable in place | Short URLs, new URL per edit |

The connector is entirely optional — nothing else depends on it, and the skill
and manual flows keep working without it.

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

## Troubleshooting

**"Add custom connector" isn't there.** Custom connectors work on every Claude
plan, but Free is limited to one, and on Team/Enterprise an owner has to enable
the connector for the organization first — see
[Anthropic's guide](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).

**Claude asks for an OAuth Client ID.** It shouldn't — leave it blank and retry
**Connect**. If it insists, paste
`https://claude.ai/oauth/mcp-oauth-client-metadata` as the Client ID and leave
the secret empty.

**The tools don't appear in the conversation.** Check the connector shows as
connected in Settings → Connectors, then start a new conversation. In Claude
Code, run `/mcp` to confirm the sign-in completed.

**Claude says it can't find a frame.** It only sees frames on the account you
signed in with. Frames made anonymously at `framejs.io` aren't attached to an
account — save them to your account first.

## Other AI options

- [Agent Skill](../guide/ai) — for coding agents with a shell, and local files.
- [AI Usage](../guide/ai) — copy/paste prompts, the LLM API, and `llms-prompt.md`.
