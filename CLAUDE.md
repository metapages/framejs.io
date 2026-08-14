# bash commands

- just check: compile types (exit code: 0 is success), instead of 'npx tsc'

# URL hash params / URL state

- ALWAYS read and write hash params through `@metapages/hash-query` — in this
  repo's code, in the docs, and in the LLM prompts we ship. NEVER hand-roll hash
  parsing or encoding: no regex/`split` on `location.hash`, no
  `new URLSearchParams(location.hash.slice(1))`, no hand-built `#?key=value`.
- Saving URL state also requires declaring the param name in the metaframe
  `definition.hashParams` (see `getAllowedHashParams`), or it is stripped on
  save / shorten / copy.
- Canonical reference: `docs/guide/url-state.md`
  (https://framejs.io/docs/guide/url-state).
