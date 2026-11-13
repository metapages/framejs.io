# Worker

The worker is a Hono app that runs on two hosts: **Cloudflare Workers** in
production, and **Deno** in the local docker stack. It serves the static
frontend and handles routing.

## Location

```
worker/
├── server.ts          # The app (all routes); `deno run server.ts` also serves static files + listens
├── cloudflare.ts      # Cloudflare Workers entry: embeds text files, wires up wasm
├── wrangler.jsonc     # Workers config (vars, static assets, routes)
├── scripts/build-cloudflare.ts  # bundles cloudflare.ts + assembles assets → dist/cloudflare
├── src/runtime.ts     # the only host differences (env vars, file reads, wasm)
├── deno.json
├── deno.lock
├── index.html
├── sw.js              # Service worker
├── static/
└── ...
```

## Key details

- Uses Deno URL imports + `npm:` specifiers for npm packages
- Type checking: `just worker/check` (runs `deno check server.ts cloudflare.ts`)
- Formatting: `just worker/fmt` (runs `deno fmt`)
- Deployed to Cloudflare Workers (see [Deployment](./deployment.md)).
  `just worker/cf-dev` runs the production build locally in workerd.
- Keep the code web-platform only. Anything that needs the host (`Deno.*`,
  Node built-ins) goes through `src/runtime.ts`; the Workers build fails if the
  bundle imports a Node built-in.

## Analytics (optional)

The worker can send cookieless, server-side usage analytics to a
[Umami](https://umami.is) instance (cloud or self-hosted). It is a no-op unless
both env vars are set:

```bash
UMAMI_HOST=https://cloud.umami.is   # or your self-hosted Umami URL
UMAMI_WEBSITE_ID=<website-uuid>     # from the Umami dashboard
```

See `worker/src/analytics.ts`. Pageviews are tracked on `GET /` and
`GET /j/:sha256`; custom events `shorten` and `fetch` are tracked on the
short-URL API endpoints, each with a `source` property (`skill` | `browser` |
`api-other`) so AI-agent/skill usage can be segmented from web-editor usage.
The framejs Agent Skill identifies itself with an `X-Framejs-Client: skill/1.0`
header. No cookies are set and no consent banner is required.

## Development

The worker runs as part of the full dev stack:

```bash
just dev
```

To type-check:

```bash
just worker/check
```

---

**Developer docs:** [Index](./README.md) · [Local Setup](./local-setup.md) · [Architecture](./architecture.md) · [Editor](./editor.md) · **Worker** · [Deployment](./deployment.md)
