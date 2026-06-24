# framejs.io → nhost: Architecture (LLM context)

Single-file architecture brief for an AI agent tasked with building the **nhost
authentication layer** and serving framejs.io as a typical logged-in app. Read
this top-to-bottom before touching auth code; it is the source of truth for how
state, iframes, and the backend fit together.

---

## 0. TL;DR mental model

framejs.io is **not** a normal CRUD app. The "app" a user runs is a single
static `index.html` that **executes arbitrary JavaScript pulled out of the URL
hash**. There is no per-app server state in the original design — *the URL is the
database*. Everything else (S3 short URLs, and now nhost/Postgres) is a layer
that **stores and retrieves that hash string** on behalf of a user.

So the conversion to nhost is fundamentally: *"take the thing that used to live
only in `#?js=...&inputs=...` and persist it as a row in Postgres, owned by an
authenticated user, addressable by a short `key`."*

Three runtime surfaces, one shared currency (the hash):

| Surface | Tech | Role | Public host |
|---|---|---|---|
| **runner** (`frontend/worker`) | Deno + Oak, static `index.html` | Executes user JS from hash; serves short URLs; S3 upload/shorten API | `js.mtfm.io` / `framejs.io` runner |
| **editor** (`frontend/editor`) | React + Vite + Chakra + Zustand | Code/settings/AI editing UI; runs *inside an iframe* | `editor.framejs.io` |
| **app** (`frontend/framer-js.io`) | Deno **Fresh 2** + Tailwind + Preact | Accounts, dashboard, projects, payments, **auth** | `framejs.io` |
| **api** (`api/nhost`) | nhost: Postgres + Hasura + Auth + Storage | Identity, GraphQL, row-level permissions | `*.nhost.run` |

> Note on repos: the real source lives in `metapages/framejs-nhost` (this repo).
> The sibling `metapages/framejs.io` checkout is stale — only `node_modules`
> remain. Do all work here.

---

## 1. The central concept: hash params ARE the application state

The runner reads these keys from `window.location.hash` (see
`frontend/worker/index.html` and the canonical schema in
`frontend/worker/server.ts` → `DEFAULT_METAFRAME_DEFINITION.hashParams`):

| key | encoding | meaning |
|---|---|---|
| `js` | `btoa(encodeURIComponent(code))` (base64) | the JavaScript module to run |
| `inputs` | `encodeURIComponent(JSON)` | input values, possibly DataRefs (base64/utf8/json/url/key) |
| `modules` | JSON array | extra script/css URLs or an import-map object (deprecated in favor of es6 imports) |
| `definition` | JSON | MetaframeDefinition (declares inputs/outputs) |
| `options` | JSON | `debug`, `disableCache`, `disableDatarefs`, `disableSmartInputUnpacking` |
| `bgColor`, `editorWidth`, `hm`, `edit` | string/bool | presentation + editor toggles (`edit=true` opens the editor overlay; `hm` = menu-button visibility) |

Encoding is handled by `@metapages/hash-query`. The editor reads/writes these via
hooks like `useHashParamBase64("js")`, `useHashParamJson("inputs")`
(`frontend/editor/src/hooks/useMetaframeUrl.ts`).

**Implication for auth/persistence:** a "project" is essentially `{ key, title,
hash_params }`. `hash_params` is the entire serialized querystring (e.g.
`?js=...&inputs=...`). Persisting and loading a project = writing/reading that
one string. This is exactly what the Postgres `projects` table does.

---

## 2. The runner (`frontend/worker`) — Deno Deploy + Oak

`server.ts` is an Oak server. Routes:

- `GET /`, `/index.html` → serves the static `index.html` runner.
- `GET /sw.js` → service worker (stale-while-revalidate caching of CDN/static assets).
- static mount `/editor/*` → serves the built editor SPA (so runner and editor are **same-origin** in production).
- `GET /metaframe.json`, `/editor/metaframe.json` → the MetaframeDefinition (declares the hash-param schema; used by the metapage tooling and AI).
- **S3 layer (Cloudflare R2 / MinIO, S3-compatible):**
  - `POST /api/upload/presign` → presigned PUT URL for direct browser→S3 upload; file stored at key `f/{sha256|uuid}`.
  - `GET /f/:id` → 302 redirect to public S3 URL.
  - `POST /api/shorten` and `POST /api/shorten/json` → hash the param string with SHA-256, store the raw hash string in S3 at key `j/{sha256}`, return `/j/{sha256}`.
  - `GET /j/:sha256` → fetch the stored hash from S3 and serve `index.html` with an **injected inline script** that sets `window.__SHORT_URL_ID` and does `history.replaceState(..., '#' + hashParams)` *before* module scripts run.
  - `GET /api/j/:sha256` → JSON `{ id, hashParams }` (immutable-cached).

**Short-URL = poor-man's persistence.** It is content-addressed (immutable,
anonymous, no owner). The nhost `projects` table is the *mutable, owned*
evolution of the same idea (`projects.storage_file_id` still links to an S3
object; `projects.hash_params` holds the live hash).

### How `index.html` runs user code (the runtime core)

1. Parse hash → load any import-map from `modules`, then load module/css URLs.
2. Decode `js`, wrap in `"use strict"`, build a `Blob`, `import()` it as an ES module.
3. The user module may export lifecycle hooks: `onInputs(inputs)`, `onResize/handleResize(w,h)`, `cleanup/dispose/unload`. Globals exposed to user code: `root` (DOM mount), `setOutput(k,v)`, `setOutputs(obj)`, `log`/`logStdout`/`logStderr`.
4. On `hashchange` → re-run everything (so editing the hash live-reloads the app).
5. **DataRefs:** `inputs` values of type `url`/`key`/`base64`/`utf8`/`json` are resolved (fetched/decoded). `key` type fetches from `https://container.mtfm.io/download/{hash}`. "Smart unpacking" turns JSON blobs into objects unless disabled.

---

## 3. The editor ↔ runner iframe protocol (the EXISTING "editor layer")

This is the iframe model the user referred to as "the editor layer, an iframe
over the main app." It uses the **`@metapages/metapage` framework**, not ad-hoc
postMessage.

- The runner (`index.html`) is itself a **Metaframe** (`new Metaframe()` connects to a parent metapage via the metapage postMessage protocol).
- When the user clicks the **Edit** menu button (or `edit=true` / no `js` + not in an iframe), `onMenuClick()`:
  1. Builds a `Metapage` definition with a single child metaframe `editor` pointing at `${origin}/editor/#?...`.
  2. Sets the editor child's iframe hash to the runner's current hash.
  3. Mounts the editor iframe as an overlay (`editor-root`, ~`editorWidth` wide; runner shrinks to `calc(100% - editorWidth)`).
  4. Listens to `Metapage.DEFINITION` change events; when the editor's iframe URL hash changes, it debounces (~400ms) and copies that hash onto `window.location.hash` of the runner → triggers re-run.
- So the **editor edits the hash; the metapage protocol syncs the editor's hash back to the host; the host re-runs.** State never leaves the URL.

Key files: `frontend/worker/index.html` (host side), `frontend/editor/src/*`
(editor UI). Editor structure: `App.tsx` (panels: Code/Settings/Docs/AI),
`store.ts` (Zustand UI state only), hooks `useMetaframeUrl`, `useShortUrlMode`,
`useAiText`, `useFileUpload`.

**`useShortUrlMode` matters for the auth/app layer:** when a page is opened from
a short URL and the user starts editing (`edit=true` + content changes), it
navigates from `/j/{sha}` to the full `/#?...` URL so edits aren't lost against
the immutable short URL. It checks `window.parent.__SHORT_URL_ID` too, i.e. it is
iframe-aware.

---

## 4. The new app layer (`frontend/framer-js.io`) — Deno Fresh 2

This is the partially-built nhost layer. It wraps the editor in *its own* iframe
and adds accounts/projects/payments on top.

### Routing & SSR auth middleware (`main.ts`)
- `App<State>` with `staticFiles()` + `fsRoutes()`.
- One middleware runs on every request: `getUserFromRequest(req)` → sets `ctx.state.user` and `ctx.state.accessToken`. If the path is protected (`isProtectedRoute`, currently just `/dashboard`) and no user → 302 to `/login?redirect=...`.
- `State = { user: User | null; accessToken: string | null }` (`utils.ts`).

### Routes (`routes/`)
- `index.tsx` — marketing home (Hero + features + CTA).
- `login.tsx`, `signup.tsx` — render `AuthForm` island; redirect to dashboard if already logged in.
- `dashboard.tsx` — protected; renders `Dashboard` island (lists/creates/deletes the user's projects).
- `[key].tsx` — **the project page.** Server-side: `graphqlAdmin` looks up the project by `key`; enforces visibility (`is_public` OR owner); renders the `Editor` island with `hash_params`, `isOwner`, and nhost subdomain/region.
- `api/projects/index.ts` — REST GET/POST over projects using the **user's** JWT (`graphqlUser(accessToken, ...)`), 401 if unauthenticated.
- `api/checkout.ts`, `api/stripe-webhook.ts` — Stripe (out of scope for auth, but `lib/stripe.ts` exists).

### Islands (client-side, `islands/`)
- `AuthForm.tsx` — calls nhost Auth REST directly from the browser: `POST {authUrl}/signin/email-password` or `/signup/email-password`. On success, writes **`nhostAccessToken`** (max-age = `accessTokenExpiresIn`, ~900s) and **`nhostRefreshToken`** (max-age 30d) cookies (`SameSite=Lax`, **not HttpOnly**), then redirects. Also has OAuth buttons → `{authUrl}/signin/provider/{github|google}?redirectTo=/auth/callback`.
- `Editor.tsx` — renders `<iframe src="${editorBaseUrl}/#?${hashParams}">` (editorBaseUrl = `EDITOR_BASE_URL` or `https://editor.framejs.io`). If `isOwner`, listens for `message` events of shape `{type:"hashchange", hash}` and **persists** via a Hasura mutation `update_projects_by_pk(... hash_params ...)` using the access-token cookie. Has a manual **Save** button that reads the iframe hash (same-origin) or posts `{type:"getHash"}`.
- `Dashboard.tsx`, `UserMenu.tsx` (logout = clear both cookies, go to `/`), `PricingCard.tsx`.

### Client GraphQL pattern
Islands read `nhostAccessToken` from `document.cookie` and POST to the Hasura
GraphQL endpoint with `Authorization: Bearer <token>`. Server routes use either
`graphqlAdmin` (x-hasura-admin-secret, full access — used for public project
lookup) or `graphqlUser` (user JWT, RLS-scoped). See `lib/nhost.ts`, `lib/auth.ts`.

---

## 5. The nhost backend (`api/nhost`)

- **Auth** (`nhost.toml [auth]`): email+password (min length 9, **email verification required**), all OAuth providers currently `enabled = false` (must be turned on per-provider to use the GitHub/Google buttons). Access token TTL **900s**, refresh token **2592000s (30d)**. Default role `user`, allowed roles `user`,`me`. `clientUrl = http://localhost:3000`.
- **Hasura JWT**: RS256, keys from secrets (`NHOST_JWT_PUBLIC_KEY/PRIVATE_KEY/KID`). Hasura validates the nhost-issued JWT and reads `x-hasura-user-id` / `x-hasura-default-role` claims.
- **Data model — `public.projects`** (`metadata/.../public_projects.yaml`), GraphQL field names camelCased:
  - columns: `id (uuid)`, `user_id`, `key`, `title`, `description`, `hash_params`, `storage_file_id`, `is_public`, `created_at`, `updated_at`; object relationship `user`.
  - **Row-level permissions (this is the real auth boundary):**
    - `public` role: SELECT only `is_public = true` rows, limited columns (no `hash_params`, no `user_id`).
    - `user` role: SELECT/UPDATE/DELETE filtered by `user_id = X-Hasura-User-Id`; INSERT forces `user_id = X-Hasura-User-Id`.
  - So: **anonymous users can read public project metadata but not private hash params; owners get full access; nobody can touch another user's rows.** Hasura enforces this regardless of what the client sends.
- Also present: standard nhost `auth_*` and `storage_*` tables, and `public_profiles`.

---

## 6. End-to-end data flows

### A. Anonymous run (legacy, still works)
`browser → runner / → reads hash → runs js`. Optionally `/j/{sha}` → S3 → injected hash → run. No identity.

### B. Logged-in project view
```
browser GET framejs.io/{key}
  → Fresh middleware: cookie nhostAccessToken → nhost /user → ctx.state.user
  → [key].tsx: graphqlAdmin lookup by key → visibility check (public|owner)
  → render Editor island with hash_params + isOwner
  → island mounts <iframe src=editor.framejs.io/#?{hash_params}>
  → (owner) edits → iframe postMessage {type:hashchange} → Hasura update_projects_by_pk (Bearer JWT, RLS-checked) → saved
```

### C. Auth
```
AuthForm island → POST nhost auth /signin|/signup (email+password)
  → session {accessToken, refreshToken} → set as cookies (JS-readable)
  → redirect /dashboard
Every request → middleware verifies token via nhost /user → user in ctx.state
Logout → delete cookies client-side
```

---

## 7. Known gaps / mismatches to resolve when building the auth layer

These are real inconsistencies in the current partial migration — call them out
and fix them as part of the auth work:

1. **iframe message contract mismatch.** `Editor.tsx` listens for
   `{type:"hashchange"}` (and sends `{type:"getHash"}`), but the editor/runner
   actually communicate via the **`@metapages/metapage` protocol**, not these
   plain messages. The editor as currently built does **not** emit
   `{type:"hashchange"}`. Either (a) embed the *runner* (`index.html`, which can
   host the editor overlay and whose hash you can observe) instead of the editor
   SPA directly, or (b) add an explicit postMessage bridge in the editor that
   emits `{type:"hashchange", hash}` on hash change and replies to `getHash`.
   Decide the contract before wiring persistence.
2. **No `/auth/callback` route exists** though `AuthForm.handleOAuth` redirects
   there. OAuth is also disabled in `nhost.toml`. To support social login you
   must: enable the provider in `nhost.toml`, create `routes/auth/callback.tsx`
   to capture the returned `refreshToken`, exchange it for a session, and set
   cookies.
3. **Token storage is not HttpOnly.** Both `nhostAccessToken` and
   `nhostRefreshToken` are written by client JS and readable by any script
   (XSS-exposed). Because the runner executes **arbitrary user JS**, this is
   higher-risk than usual. Strongly prefer: set tokens as **HttpOnly,
   Secure, SameSite cookies from a Fresh server route** (move signin server-side),
   and never let the editor/runner origin see the app's cookies.
4. **No refresh flow.** Access token expires in 15 min; nothing calls nhost
   `/token` with the refresh token. Sessions silently die. Add server-side
   refresh (middleware: if access token expired but refresh token valid → call
   nhost `/token`, rotate cookies).
5. **Cross-origin cookie reach.** The editor iframe (`editor.framejs.io`) reads
   `document.cookie` for `nhostAccessToken` in `Editor.tsx`/`Dashboard.tsx` — but
   that only works if it's same-origin with the app. In production the app is
   `framejs.io` and the editor is `editor.framejs.io` → **different origins, the
   cookie is NOT shared.** The save-from-iframe path needs the token passed
   explicitly (postMessage handshake) or the save must be brokered by the Fresh
   server (island → `/api/projects/...` same-origin → `graphqlUser`).
6. **Admin-secret lookup for project pages** (`[key].tsx` uses `graphqlAdmin`).
   Fine for reading public rows, but it bypasses RLS — make sure private rows are
   only ever rendered after the explicit `is_public || owner` check (currently
   done) and never leak `hash_params` of private projects to non-owners.

---

## 8. Recommended auth architecture for nhost (target design)

Goal: framejs.io behaves like a typical nhost app with login, while preserving
the "URL is the state" runner and the editor-iframe model.

**Identity & sessions (server-brokered, HttpOnly):**
- Add Fresh server routes: `POST /api/auth/login`, `/api/auth/signup`,
  `/api/auth/logout`, `/api/auth/callback` (OAuth), `/api/auth/refresh`.
- These call nhost Auth REST server-side and set **HttpOnly + Secure +
  SameSite=Lax** cookies for access & refresh tokens. `AuthForm` posts to these
  routes instead of hitting nhost directly. This keeps tokens out of reach of
  the user-JS runner.
- Centralize in `lib/auth.ts`: `getUserFromRequest` (already exists), plus
  `refreshIfNeeded`, `setSessionCookies`, `clearSessionCookies`. Wire refresh
  into the global middleware.

**Authorization = Hasura RLS (already correct):** keep `user_id =
X-Hasura-User-Id` permissions as the enforcement layer. Client and server GraphQL
both send the user JWT; never expose the admin secret to the browser.

**Project ↔ hash bridge:** pick one of the two iframe strategies in §7.1 and make
the editor emit a stable `{type:"hashchange", hash}` message (and answer
`getHash`). Persist through a **same-origin Fresh API route** that calls
`graphqlUser`, so the editor origin never needs the cookie. Optionally validate
the project owner server-side again before writing.

**Serving model (typical app):**
- `framejs.io` → Fresh app (marketing, auth, dashboard, `/{key}` project pages).
- `editor.framejs.io` → built editor SPA (embedded as iframe).
- runner `index.html` → served by the Deno worker (same-origin with editor under
  `/editor`), used both standalone (legacy short URLs) and as the embeddable
  surface.
- `*.nhost.run` → Auth + Hasura GraphQL + Storage.
- Deploy targets (per `justfile`): **Deno Deploy** for Fresh app + worker,
  **nhost** for the API. Local dev uses `docker-compose` with MinIO standing in
  for R2, Traefik for `*.localhost` hosts.

**Env/config knobs:** `NHOST_SUBDOMAIN`, `NHOST_REGION`, `NHOST_ADMIN_SECRET`,
`EDITOR_BASE_URL`, plus `S3_*` for the worker and `STRIPE_*` for payments.

---

## 9. File index (where to look)

- Runner: `frontend/worker/{server.ts,index.html,sw.js}`
- Editor: `frontend/editor/src/{App.tsx,store.ts,hooks/*,components/*}`
- App: `frontend/framer-js.io/{main.ts,utils.ts}`,
  `routes/{index,login,signup,dashboard,[key]}.tsx`, `routes/api/*`,
  `islands/{AuthForm,Editor,Dashboard,UserMenu}.tsx`,
  `lib/{nhost.ts,auth.ts,stripe.ts}`, `components/Layout.tsx`
- Backend: `api/nhost/{nhost.toml,config.yaml}`,
  `api/nhost/metadata/databases/default/tables/public_projects.yaml`
- Orchestration: `justfile`, `frontend/docker-compose.yml`, `.traefik/*`
