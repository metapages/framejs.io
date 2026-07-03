---
name: framejs-origins
description: >
  Maps the framejs.io / framejs.app origin split between this repo and its
  sibling framejs-nhost repo, plus each one's local dev address. Load whenever
  working with cross-app URLs, FRAMEJS_APP_ORIGIN/FRAMEJS_IO_ORIGIN env vars,
  or debugging requests between the rendering runtime and the account layer.
---

# framejs.io / framejs.app origin map

This repo (`metaframe-js`) serves **framejs.io** — the public rendering
runtime (uploads, screenshots, the metaframe that actually executes user
code). Docker Compose + Traefik stack (`worker/`).

Its sibling, `framejs-nhost`, at
`/Users/dion/dev/git/metapages/framejs-nhost`, serves **framejs.app** — the
account layer: auth, frame storage, Hasura/nhost backend (`api/`) + Deno Fresh
worker (`frontend/worker/`).

| App         | Repo (this machine)                             | Production            | Local dev                            |
| ----------- | ------------------------------------------------- | ---------------------- | ------------------------------------- |
| framejs.io  | `metaframe-js` (here)                              | `https://framejs.io`   | `https://framejs-io.localhost:4470`   |
| framejs.app | `framejs-nhost` (`.../framejs-nhost`)              | `https://framejs.app`  | `https://framejs-app.localhost:5173`  |

**Source of truth, don't hardcode:** local ports/hosts can drift from the table
above. Check this repo's `.env` (`FRAMEJS_APP_ORIGIN`) for what it currently
points at for framejs.app, and the sibling repo's `frontend/worker/.env`
(`FRAMEJS_IO_ORIGIN`) for what it points at here. Both vars are read live by
the `framejs` Agent Skill helper
(`worker/static/skill/framejs/scripts/framejs.mjs`) — see
`worker/static/skill/README.md` for the canonical table and the skill-dev
workflow that consumes it.

Run both stacks locally:
- framejs.io (here): `just dev` → `https://framejs-io.localhost:4470`
- framejs.app (sibling): `cd .../framejs-nhost/api && just dev` (nhost stack),
  then `cd frontend/worker && just dev` → `https://framejs-app.localhost:5173`

Both bind dedicated `*.localhost` hosts (never bare `localhost`) over HTTPS via
mkcert, so the two apps' cookies/sessions don't collide. If a host doesn't
resolve, see that repo's `_hostcheck` justfile recipe.

For the mirror of this file, see
`framejs-nhost/.claude/skills/framejs-origins/SKILL.md`.
