---
name: framejs-nhost-dev
description: >
  Runbook for the framejs-nhost repo: start/stop the nhost api stack, run the
  Deno Fresh worker, generate the typed Hasura GraphQL SDK, run tests, and the
  auth/data architecture. Load this whenever working on frontend/worker or the
  api/ nhost backend — especially before running justfile commands (many at the
  repo root are inherited cruft), generating GraphQL types, or touching auth.
---

# framejs-nhost developer runbook

Accumulated, verified knowledge for this repo. Prefer these commands over the
root justfiles — see the **landmines** section for why.

## Repo layout (what actually exists)

- `api/` — Nhost backend (hasura-auth, Hasura GraphQL, postgres, storage,
  mailhog), driven by the `nhost` CLI. Local URLs are `*.local.nhost.run`.
- `api/tools/codegen/` — Dockerized graphql-codegen (pinned old
  `@graphql-codegen/cli`), byte-identical to superslides.io. Shared toolchain.
- `frontend/worker/` — the only frontend app: Deno Fresh 2 + Preact + Vite
  (islands, SSR + client hydration). Served at framejs.io.
- `test/` — integration tests.

There is **no `frontend/browser/`** and **no `editor/`** here, despite what some
justfiles imply (see landmines).

## Landmines: root justfiles are inherited cruft

The **root `justfile`** and **`frontend/justfile`** were copied from sibling
repos (superslides.io and metaframe-js) and reference paths that do **not exist**
in this repo. Do not trust them as the source of truth:

- Root `just generate` → tries `frontend/browser/generate` / `api/generate`
  (don't exist or are wrong here). **It does not generate the worker SDK.**
- Root `just dev` / `just frontend/dev` → reference `frontend/browser`,
  `editor/`, docker-compose stacks from metaframe-js.
- Root `just check` / `just test` → fan out into `editor/check`,
  `connect.superslides.io`, etc.

**Rule:** use the **leaf justfiles** (`api/`, `frontend/worker/`) directly. Those
are real and maintained. When in doubt, `cat` the specific justfile before running.

## Start / stop the stack

```bash
# Bring the nhost api stack up (hasura, auth, postgres, storage, mailhog)
just api/dev          # = nhost up --apply-seeds --down-on-error

# Stop it
just api/down

# Tail service logs (service=functions|graphql|auth|...)
just api/logs graphql

# Run the worker dev server (separate terminal; needs api stack up for data)
cd frontend/worker && just dev    # = deno task dev → https://framejs.localhost:5173
```

**One-time prereq — add the dev host to `/etc/hosts`:** `vite.config.ts` binds
the dev server to a dedicated host (`server.host = "framejs.localhost"`) so the
app gets its OWN cookie jar — the `nhostSession` auth cookie can't collide with
sibling apps on bare `localhost` (a stale collision there caused silent login
failures). Browsers auto-resolve `*.localhost` to loopback, but the **server-side
bind** does not: Deno/vite calls `getaddrinfo("framejs.localhost")` and, with no
hosts entry, fails to start with `Error: getaddrinfo ENOTFOUND framejs.localhost`.
Fix once:

```bash
printf '127.0.0.1 framejs.localhost\n::1 framejs.localhost\n' | sudo tee -a /etc/hosts
```

The config also shells out to `mkcert` on startup to mint a cert covering
`framejs.localhost` (so HTTPS is trusted). Missing mkcert only warns (not a
failure) but the browser will distrust the cert — install with
`brew install mkcert && mkcert -install`.

Local service URLs (from `just api/_help`):
- Hasura console: https://local.hasura.local.nhost.run
- GraphQL: https://local.graphql.local.nhost.run/v1
- Auth: https://local.auth.local.nhost.run
- Mailhog: https://local.mailhog.local.nhost.run
- Postgres: `postgres://postgres:postgres@localhost:5432/local`
- Admin secret (local): `nhost-admin-secret`

## Worker env (`frontend/worker/.env`, gitignored)

```
NHOST_SUBDOMAIN=local
NHOST_REGION=local            # must be "local", NOT empty, or URLs won't resolve
NHOST_ADMIN_SECRET=nhost-admin-secret
VITE_NHOST_SUBDOMAIN=local    # VITE_* are exposed to the browser by Vite
VITE_NHOST_REGION=local
```

`region=local` is what makes the nhost URL builders emit `*.local.nhost.run`.

## Generate the typed GraphQL SDK

Codegen is **Dockerized** (so the pinned old codegen toolchain doesn't pollute
the host) and reaches the local Hasura schema over `--net=host`.

### Worker (this is the one that exists)

```bash
cd frontend/worker && just generate
```

Requires: api stack up (it introspects the live schema) + Docker running.
Flow: `frontend/worker/just generate` → `api/tools/codegen/just generate
frontend/worker/lib/graphql` → `docker build -t codegen .` then
`docker run --net=host -v repo:/app --workdir=/app/<dir> codegen just generate`,
which runs graphql-codegen inside the container.

- Inputs: `frontend/worker/lib/graphql/queries/*.graphql` +
  `frontend/worker/lib/graphql/codegen.yml`.
- Output: `frontend/worker/lib/graphql/generated/sdk.ts` (committed).
- To add a query: edit/add a `.graphql` file under `queries/`, re-run generate.

**Deno gotcha (critical):** `codegen.yml` sets `config.documentMode: string`.
Without it, the generated SDK does `import gql from 'graphql-tag'`, which is not
callable under Deno's CJS/ESM interop. `documentMode: string` emits documents as
plain strings and drops the graphql-tag dependency.

**Non-tty gotcha:** the codegen `docker run` uses `-ti`. In a non-interactive
context (CI, agent), drop the `-t` or it errors on "the input device is not a TTY".

### Functions (NOT set up yet)

`api/functions/` currently has **no codegen** — no `codegen.yml`, no
`queries/*.graphql`, no `generate` recipe. The root/api `generate` recipes that
mention functions are inherited from superslides and don't apply. To add it,
mirror the worker setup: a `codegen.yml` (same schema + `documentMode: string`),
a `queries/` dir, and a `generate` recipe delegating to
`api/tools/codegen/generate <dir>`.

## Run tests / type-check

```bash
# Type-check the worker (per CLAUDE.md, use this instead of `npx tsc`)
cd frontend/worker && just check          # = deno check main.ts

# Integration check: signs up a throwaway user, creates + deletes a project
# via the authenticated server SDK, cleans up. Needs api stack up.
cd frontend/worker && just test           # = deno test -A lib/graphql/projects.test.ts

# Format
cd frontend/worker && just fmt            # = deno fmt .
```

### Browser e2e (Playwright)

The signup → login → frame CRUD browser flow is covered by a committed
Playwright suite:

```bash
just test/e2e            # = playwright test --config=playwright.worker.config.ts
just test/setup          # one-time: npm install + playwright install chromium
```

- `test/playwright.worker.config.ts` targets the worker at
  `https://localhost:5173` with `ignoreHTTPSErrors: true`, `testMatch
  **/*.e2e.spec.ts`, and a `webServer` that starts `deno task dev`
  (`reuseExistingServer: true`). **Prereq: the api stack must be up
  (`just api/dev`)** — the browser hits `local.auth`/`local.graphql` directly.
- `test/tests/frames.e2e.spec.ts` is a serial flow (one throwaway user) that
  signs up, creates a frame, logs out + back in, and soft-deletes — asserting
  the DB row keeps `deleted = true`. `afterAll` purges the user via the admin
  GraphQL endpoint (versions → frames → user, per the FK RESTRICT order).
- Kept separate from the inherited `test/playwright.config.ts` +
  `short-url.spec.ts`, which target a **different sibling app** (`framerio.local`,
  `/api/shorten/*` routes that don't exist here) — more inherited cruft.

**Local TLS note:** the worker mints an mkcert cert (on every startup) covering
`framejs.localhost`, `localhost`, and the loopback IPs — so both the dedicated
dev host and the e2e config's `https://localhost:5173` are trusted (they bind to
the same loopback socket; the e2e baseURL still works). The nhost services
present a Let's Encrypt cert whose SANs (`*.auth.local.nhost.run`,
`*.graphql.local.nhost.run`, …) **do** cover the `local.<svc>.local.nhost.run`
hostnames, so a real browser trusts them. If browser login silently fails where
automation succeeds, suspect stale local state (old `nhostSession` cookie,
cached bundle, or a stale dev-server process), not the cert or the code.

## Auth + data architecture (the important mental model)

The browser talks to **Hasura directly** with the user's JWT — there is **no REST
gateway**. Hasura row-level permissions (role `user`, scoped by
`X-Hasura-User-Id`) do the auth. The old `routes/api/projects/*` REST routes were
deleted on purpose. Modeled on `../superslides.io/frontend/browser`.

- **Session/auth:** `@nhost/nhost-js` (modern `createClient` SDK) with
  `CookieStorage`. `lib/nhost.client.ts` `getNhost()` is a **lazy** browser
  singleton (lazy so it never constructs during SSR, where `document` is
  undefined). The full session is persisted as a non-httpOnly `nhostSession`
  cookie (`encodeURIComponent(JSON.stringify(session))`).
- `islands/AuthForm.tsx` → `nhost.auth.signInEmailPassword` /
  `signUpEmailPassword`. `islands/UserMenu.tsx` logout → `nhost.auth.signOut` +
  `nhost.clearSession()`.
- **SSR gating:** `lib/auth.ts` `getUserFromRequest` reads the same
  `nhostSession` cookie, JSON-parses it, and gates protected routes — no
  auth-service round-trip. The shared cookie is what keeps SSR and the browser
  in sync (the key Deno-Fresh-vs-SPA difference). It iterates **all**
  `nhostSession` values in the Cookie header and uses the first that parses to a
  real session — a request can carry a stale/sibling duplicate (parent-domain or
  different path) the host-only `remove()` can't clear, and if a malformed one is
  ordered first, taking only the first match would JSON-parse-fail and **silently
  bounce login back to /login** (no console error: the client's
  `hasSessionCookie()` still sees *a* cookie). Symptom: "/login just reloads".
  First fix for that symptom: load the app at `https://framejs.localhost:5173`
  (not bare `localhost`) and clear stale cookies on both hosts.
- **Browser data (primary):** `lib/graphql/client.browser.ts` `getBrowserSdk()`
  — a graphql-request client pointed at `nhost.graphql.url` with a
  `requestMiddleware` that refreshes (`nhost.refreshSession(60)`) and attaches
  the JWT per request. Islands (e.g. `islands/Dashboard.tsx`) call Hasura
  directly via the generated `getSdk`.
- **Server data (SSR only):** `lib/graphql/client.ts` `getUserSdk(token)` /
  `getAdminSdk()` for things that must run during render, e.g. `routes/[key].tsx`
  loading a project (admin) to check private-project ownership before render.

## Schema gotcha: camelCase columns

The `projects` table uses **custom camelCase Hasura column names**: `isPublic`,
`createdAt`, `updatedAt`, `hashParams`, `storageFileId`, `userId`. Hand-written
snake_case queries are silently wrong (no error, just no/incorrect data). Always
go through the generated SDK so the field names come from the schema.

## Frame data model (the primary user document)

A **frame** (`public.frame`) is the durable object a user owns; its editable
content lives in appended **`frame_version`** rows (newest = `created_at desc,
limit 1`). A version holds `url` (framejs.io hash params — the content for now;
the `file` column is ignored) and `og` (jsonb Open Graph `{title, description,
image}`, used for dashboard display; `image` ignored for now). CRUD lives in
`frontend/worker/lib/graphql/queries/frames.graphql` (+ `frames.test.ts`):

- **Create** = one nested insert: `insert_frame_one(object: { public,
  frame_versions: { data: [{ url, og }] } })`. The owning `user` column is set
  server-side from the JWT by Hasura's insert permission — never pass it.
- **Edit** = append a new `frame_version` (`insert_frame_version_one`), never
  mutate an existing one.
- **Delete** = soft: `update_frame_by_pk(_set: { deleted: true })`. Listing
  filters `deleted: { _eq: false }`. Hard-deletion happens elsewhere, later.

Gotchas:
- The `user`-role **update** permission on `frame` originally allowed only
  `public`; soft-delete needs `deleted` in that column list too (added to
  `public_frame.yaml`). There is no `nhost` metadata-apply recipe — apply
  permission tweaks via the Hasura metadata API
  (`https://local.hasura.local.nhost.run/v1/metadata`, `pg_drop_update_permission`
  / `pg_create_update_permission`) and keep the yaml in sync so it persists.
- `frame` (and `frame_version`) FKs are **ON DELETE restrict**, so test cleanup
  must hard-delete in order: versions → frames → user, before `deleteUsers`.

## Editing a frame: the embedded framejs.io metapage (`/j/:uuid`)

`routes/j/[uuid].tsx` → `islands/FrameView.tsx` is the owner-only edit view. It
embeds the live **framejs.io runtime as a metaframe** and persists edits as new
`frame_version` rows. The non-obvious mechanics:

- The runtime is itself a `@metapages/metapage` **metaframe**. Embed it with
  `Metapage.from({ version: "1", metaframes: { f: { url } } })`, then append
  `mp.getMetaframe("f")._iframe` to a container (raw `Metapage.from` does NOT
  attach the iframe to the DOM — only `renderMetapage` does).
- **Reading hash-param edits:** the runtime (child) auto-forwards its own
  `hashchange` to the parent as a `HashParamsUpdate` RPC; the parent Metapage
  rewrites `definition.metaframes.f.url` and emits `Metapage.DEFINITION`. So
  listen for `Metapage.DEFINITION` and read `event.definition.metaframes.f.url`.
  No raw `postMessage`/`"hashchange"` contract is involved (the legacy
  `islands/Editor.tsx` `postMessage` approach is for the old `projects` model).
- **Import it dynamically** (`await import("@metapages/metapage")` inside the
  effect) — the lib touches `window`, so a top-level import breaks SSR.
- Dedup/normalize: `lib/frame.ts` `normalizeFrameUrl` strips transient params
  (`hm`/`edit`/`css`) and sorts the rest, so the `hm=visible` we add for the
  embed (`embedFrameUrl`) doesn't echo back as a spurious save.
- **Undo** re-stamps the previous version's `created_at` to now (so it becomes
  newest). This needs the `frame_version` update permission on `created_at`
  (added to `public_frame_version.yaml`, role `user`, scoped to owned frames).
- `GetFrames` (dashboard "Your Frames") is **owner-scoped** (`where: { user:
  { _eq: $userId } }`). The `user`-role select permission also exposes *public*
  frames (for `/j/:uuid` sharing), so an unscoped query would list everyone's
  public frames.
- The `/j/:uuid` path carries the uuid **without dashes** (`frameSlug` /
  `frameIdFromSlug` in `lib/frame.ts`); the route re-inserts dashes before the
  DB query. The framejs.io origin is `Deno.env.get("FRAMEJS_IO_ORIGIN")`
  (default `https://framejs.io`).
- `routes/j/[uuid].json.ts` is a **public, auth-exempt** read-only API: it
  returns the latest version's hash params decoded into `{ key: value }`
  (`unpackFrameUrl`), gated only by `frame.public === true`. The exemption is in
  `lib/auth.ts` (`/j/...json` bypasses the `/j/` auth gate). framejs JSON hash
  params are base64 (`base64(encodeURIComponent(JSON.stringify(v)))`), so decode
  via `unpackHashParamValue` — a plain `JSON.parse` fails.

## Shared-config warnings

- `api/nhost/nhost.toml` is **shared between local and deployed** environments.
  `emailVerificationRequired = false` was set there so local signup returns a
  session immediately. Re-enable / override before relying on it in production.
  Regenerating the toml (e.g. via an nhost version upgrade) resets this flag to
  `true` — re-set it and `just api/dev` if signup starts demanding email verify.
- `frontend/worker/deno.json` has `nodeModulesDir: "manual"`, so after adding an
  npm import you must run `deno install` or you'll get "Could not find a matching
  package for npm:...".

## Keeping this skill current

When you learn something non-obvious about building/running/testing this repo,
update this file. It is the checked-in, team-visible counterpart to the
per-user memory notes (`worker-local-nhost-wiring`, `worker-graphql-codegen`).
