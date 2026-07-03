# framejs Agent Skill — develop & test against the local stack

Developer notes for the `framejs` skill under [`framejs/`](./framejs/). This
file is **not** part of the shipped skill — `just build-skill` bundles only the
`framejs/` folder into `framejs.tar.gz`.

- **Source:** [`framejs/`](./framejs/) — `SKILL.md`, `references/`, and the
  `scripts/framejs.mjs` helper.
- **Ships as:** `framejs.tar.gz` (built by `just build-skill`) + `install.sh`,
  both served by the framejs.io worker at `/skill/…`.
- **Installed by:** `curl -fsSL https://framejs.io/skill/install.sh | sh`, which
  extracts the tarball into a skills dir (default `~/.claude/skills/framejs`) —
  i.e. a **copy**, not a link.

## What the skill talks to

The helper targets two backends, each overridable (it also auto-loads a nearby
`.env`, so a local checkout points at the dev stacks with no extra config):

| Backend     | Purpose                               | Env var                                      | Prod                  | Local dev                            |
| ----------- | ------------------------------------- | -------------------------------------------- | --------------------- | ------------------------------------ |
| framejs.app | frame storage — `POST /j/<uuid>.json` | `FRAMEJS_APP_ORIGIN`                         | `https://framejs.app` | `https://framejs-app.localhost:5173` |
| framejs.io  | runtime, uploads, screenshots         | `FRAMEJS_IO_ORIGIN` (legacy: `FRAMEJS_BASE`) | `https://framejs.io`  | `https://framejs-io.localhost:4470`  |

Both local origins are already set in this repo's `.env`.

## 1. Start the local stacks

- **framejs.io** (this repo): `just dev` → `https://framejs-io.localhost:4470`.
- **framejs.app** (the `framejs-nhost` repo): start the nhost api stack
  (`cd api && just dev`), then the worker (`cd frontend/worker && just dev` →
  `https://framejs-app.localhost:5173`).

Both bind `*.localhost` hosts over HTTPS with mkcert certs; the `_hostcheck`
recipes tell you the `/etc/hosts` entries to add if a host doesn't resolve.

## 2. Install the skill for local testing

### Option A — symlink (recommended for active development)

Point your agent's skills dir at the repo so edits are live:

```bash
# from this repo root; removes any existing install first
just dev-install-skill                 # → ~/.claude/skills/framejs
# or another harness's dir:
just dev-install-skill ~/.cursor/skills
```

The helper resolves symlinks, so `import.meta.url` lands back in this repo and
it auto-loads this repo's `.env` → **the skill targets the local stacks
automatically**. (This is a dev-only setup: while the symlink is in place the
skill hits your local stacks everywhere. Re-run `install.sh` to restore the real
copy when done.)

Editing `scripts/framejs.mjs` or `references/*` is picked up on the next run.
`SKILL.md` and frontmatter are read at **agent startup** — restart the agent
after changing them.

### Option B — install from the local stack (exercises the real install path)

Serve the freshly built tarball from the local framejs.io worker and install it
like an end user would (your system trusts the mkcert CA, so curl needs no
`-k`):

```bash
just build-skill        # regenerate framejs.tar.gz (just dev also does this)
curl -fsSL https://framejs-io.localhost:4470/skill/install.sh \
  | FRAMEJS_BASE=https://framejs-io.localhost:4470 sh
```

This installs a copy; it targets local stacks only when the helper can find
local origins (see §3).

## 3. Point the helper at the local stacks

Origins resolve in this order (first hit wins), per `loadDotEnv` in the helper:

1. `FRAMEJS_APP_ORIGIN` / `FRAMEJS_IO_ORIGIN` already in the environment.
2. The nearest `.env` walking up from the current working directory.
3. The nearest `.env` walking up from the helper script's directory (with the
   Option-A symlink this is **this repo's `.env`**).
4. Production defaults.

So: the **symlink** install targets local automatically; a **copy** install
targets local when you run the agent from inside this repo (or export the two
`*_ORIGIN` vars, or drop a `.env` in the working dir).

**Node TLS (required for the HTTPS dev stacks).** Node does not trust the macOS
keychain, so its `fetch` rejects the mkcert certs unless you point it at the CA.
This must be in the **environment before the agent/helper starts** (it's read at
Node boot, too early for `.env` loading):

```bash
export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
# quick-and-dirty alternative (insecure): export NODE_TLS_REJECT_UNAUTHORIZED=0
```

## 4. Manual smoke test

With the stacks up, the skill installed (Option A), and `NODE_EXTRA_CA_CERTS`
set:

```bash
SKILL=~/.claude/skills/framejs/scripts/framejs.mjs
# create — mints a frame and records its uuid in --state
echo 'export function onInputs(){ document.getElementById("root").textContent = "hi"; }' \
  | node "$SKILL" create --state /tmp/framejs-frame.json --no-open --title "Smoke test"
#  → https://framejs-app.localhost:5173/j/<uuid>      (the framejs.app page; needs login)
#    run: https://framejs-io.localhost:4470/#?js=…    (no-login runnable URL)
#    id:  <uuid>

# update the SAME frame (same --state) — appends a version at the same URL
echo 'export function onInputs(){ document.getElementById("root").textContent = "hi v2"; }' \
  | node "$SKILL" create --state /tmp/framejs-frame.json --no-open

# read it back (or: curl -s https://framejs-app.localhost:5173/j/<uuid>.json)
node "$SKILL" fetch <uuid>
```

Open the `run:` URL to see the app with no login. To watch the **live update**,
open the framejs.app page `https://framejs-app.localhost:5173/j/<uuid>` (log in
first) and re-run `create` — the page updates without a reload.

To drive it through an agent instead: install via Option A, start the agent with
`NODE_EXTRA_CA_CERTS` set, and ask e.g. _"make a bouncing ball animation"_ — it
should create a frame on your local framejs.app.

## 5. Automated integration tests

- **Helper (hermetic, no stack):** `just check-skill` validates the skill and
  runs `scripts/test-skill-helper.mjs`, which drives `create`/`fetch` against an
  in-process stub (uuid/state/`--new`/`--id`/output/`.env` loading).
- **framejs.app API + live-update subscription (real stack):** in the
  `framejs-nhost` repo, `cd frontend/worker && just test-e2e` — it brings up the
  nhost api stack + dev server and runs the Playwright suite in
  `frontend/worker/test/`.
