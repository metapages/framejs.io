# Local Setup

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [just](https://github.com/casey/just) command runner
- [mkcert](https://github.com/FiloSottile/mkcert) for local HTTPS certificates
- [Deno](https://deno.land/) (for worker development and deployment)
- Node.js (for editor development)

## Running the dev server

```bash
just dev
```

This starts the full stack via Docker Compose:
- **Traefik** reverse proxy with HTTPS (using mkcert certs)
- **Worker** (Deno backend)
- **Editor** (Vite dev server)

The dev server is available at `https://framejs-io.localhost:4430/` (configurable via `APP_FQDN` and `APP_PORT` env vars).

## Useful commands

```bash
just              # list all available commands
just dev          # start dev server
just down         # shut down dev server
just check        # type-check editor + worker
just fmt          # format code (Prettier + deno fmt)
just test         # run all tests
just clean        # delete all cached/generated files and docker volumes
```

## Python widget development

```bash
just test-python       # run unit tests
just build-python      # build package
just jupyter-docker    # run JupyterLab with editable widget
just marimo-docker     # run marimo with editable widget
```

See [Jupyter](../integrations/jupyter.md) and [marimo](../integrations/marimo.md) for more details.

---

**Developer docs:** [Index](./README.md) · **Local Setup** · [Architecture](./architecture.md) · [Editor](./editor.md) · [Worker](./worker.md) · [Deployment](./deployment.md)
