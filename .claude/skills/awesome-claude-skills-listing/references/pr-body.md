# PR body template

Their guidelines require the body to cover: what problem it solves, who uses the
workflow, attribution, and an example. Fill the bracketed bits, drop the rest
verbatim. Write it to a file and pass `--body-file` so the em dashes and code
fences survive the shell.

---

**What problem it solves**

Getting a chart, simulation, or small interactive tool out of an agent normally
means a scaffolded project, a dev server, and a browser the user has to wire up
themselves — or a static image that can't be poked at. The framejs skill turns
the request into a single browser JavaScript module hosted at a shareable URL
that runs instantly: no build, no server, no account. The agent hands back a
link the user can open, share, or ask for edits to.

**Who uses this workflow**

Built for and used in [framejs.io](https://framejs.io) — anyone asking an agent
to "plot this", "animate that", or "make me a little tool", plus notebook users
(Jupyter/marimo examples ship with the project) who want an interactive view of
local data.

**Example**

> "Plot the last column of ./results.csv against time, log y-axis"

The skill uploads the file, writes the module, creates the app, and prints its
URL. A follow-up like *"colour the points by run id"* fetches the existing code
from that URL and updates the app in place — same link, new behaviour.

**Notes on this PR**

The entry links to the skill's canonical location in the framejs.io repo rather
than vendoring a copy, so the listing tracks the maintained version and never
needs a PR for routine skill updates. The skill is validated on every build
against the Agent Skills spec, and works in Claude Code (shell/automation mode)
as well as Claude.ai and the API (code-block mode).

**Attribution**

**Credit:** Based on the framejs.io project by [@dionjwa](https://github.com/dionjwa) / metapages.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
