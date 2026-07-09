# Developer Documentation

Internal docs for developing, building, and deploying **framejs.io**. These pages
are **not** published to the [public docs site](https://framejs.io/docs) — they
live in the repo for contributors.

> Looking for user docs? See the published site: **https://framejs.io/docs**

## Contents

- [Local Setup](./local-setup.md) — prerequisites and running the dev stack
- [Architecture](./architecture.md) — how it works, project structure, URL state
- [Editor](./editor.md) — the React/Vite frontend
- [Worker](./worker.md) — the Deno/Hono backend
- [Deployment](./deployment.md) — publishing the site and Python package

## Quick reference

```bash
just              # list all available commands
just dev          # start the full dev stack (worker + editor + traefik)
just check        # type-check editor + worker
just fmt          # format code
just test         # run tests
just publish      # build + deploy to Deno Deploy
```

See [Local Setup](./local-setup.md) to get started.
