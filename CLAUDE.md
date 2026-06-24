# dev runbook

- **Read the `framejs-nhost-dev` skill** (`.claude/skills/framejs-nhost-dev/`)
  before running justfile commands, generating GraphQL types, or touching auth.
  It has the verified commands and gotchas. Note: the **root** `justfile` and
  `frontend/justfile` are inherited from sibling repos and reference paths that
  don't exist here — use the leaf justfiles (`api/`, `frontend/worker/`).

# bash commands

- type-check the worker: `cd frontend/worker && just check` (= `deno check
  main.ts`; exit 0 is success), instead of `npx tsc`

# project structure

- frontend/worker: Deno Fresh 2 + Tailwind app (user accounts, projects, payments), served at framejs.io
- api/: Nhost backend (auth, Hasura GraphQL, storage, migrations)
- test/: integration tests

# Tasks

 - ./frontend/worker
   - Get basic user creation and password login working with the backend nhost stack ( at ./api )
   - More to come, stop when complete