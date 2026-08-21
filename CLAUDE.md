# bash commands

- just check: compile types (exit code: 0 is success), instead of 'npx tsc'

# URL hash params / URL state

- **Frame code** (what a user or an agent writes to run in a frame, and every
  example we ship in docs, the skill and the LLM prompts) saves state with the
  core globals `getJson(key)` / `saveJson(key, value)`. Never tell frame authors
  to import `@metapages/hash-query`, and never mention `definition.hashParams`
  as something they must do — `saveJson` declares the key itself.
- **This repo's own code** (editor, worker, local-server, tests) still reads and
  writes hash params through `@metapages/hash-query`. NEVER hand-roll hash
  parsing or encoding anywhere: no regex/`split` on `location.hash`, no
  `new URLSearchParams(location.hash.slice(1))`, no hand-built `#?key=value`.
- `getJson`/`saveJson` are defined in `worker/index.html` (the runtime); the
  whitelist they write into is `definition.hashParams` (see
  `getAllowedHashParams`), which is what keeps a param from being stripped on
  save / shorten / copy.
- Canonical reference: `docs/guide/url-state.md`
  (https://framejs.io/docs/guide/url-state).
