# Architecture

## How it works

metaframe-js runs user JavaScript modules embedded in the URL. The key design principle: **no state is stored on the server**.

- All code and configuration lives in the URL hash
- The server simply serves a static `index.html`
- The client extracts and runs the embedded JavaScript — code is never sent to the server
- URL length limits in modern browsers are large, and often not specifically limited at all

## Project structure

```
metaframe-js/
├── editor/          # React frontend (Vite + Chakra UI + TypeScript)
├── worker/          # Deno backend (Hono framework)
├── python/          # metaframe-widget Python package (anywidget)
├── examples/
│   ├── jupyter/     # Jupyter integration tests and examples
│   └── marimo/      # marimo integration tests and examples
├── test/            # Integration tests (Playwright + Vitest)
├── docs/            # This documentation site (VitePress)
├── docker-compose.yml
└── justfile         # Command runner
```

## Metaframes and metapages

This website is a [metaframe](https://docs.metapage.io/docs/what-is-a-metaframe): a self-contained web application that communicates via inputs and outputs. Connect metaframes together into apps, workflows, and dashboards called [metapages](https://docs.metapage.io/docs).

```mermaid
graph LR
    subgraph metapage
        direction LR
        left1(upstream metaframe) -->|inputs| M[metaframe-js]
        M -->|outputs| right1(downstream metaframe)
    end
```

## URL state management

State is encoded in the URL hash using [@metapages/hash-query](https://www.npmjs.com/package/@metapages/hash-query). The editor uses React hooks (`useHashParamBase64`, `useHashParamJson`) to read and write hash parameters.

See [URL State](../guide/url-state.md) for the JavaScript API.

---

**Developer docs:** [Index](./README.md) · [Local Setup](./local-setup.md) · **Architecture** · [Editor](./editor.md) · [Worker](./worker.md) · [Deployment](./deployment.md)
