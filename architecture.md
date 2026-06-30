# framejs — Authentication & Security Architecture

> Self-contained design doc for re-hosting the framejs runtime inside an **nhost.io**
> stack (Postgres + Hasura GraphQL + nhost Auth + nhost Storage) with user login.
> Written to be portable into the nhost app repo. Companion (current-system detail):
> `docs/nhost-migration-architecture.md`.

## Objectives

1. **Runtime = a safe URL that runs arbitrary user JavaScript and embeds anywhere.**
   Two flavors:
   - `/j/:sha256` — **immutable**, content-addressed (exists today).
   - `/i/:uuid` — **mutable**, DB-backed: the owner can update it, non-owners
     cannot, and it can be made publicly readable by link.
2. **The auth/edit layer is a distinct origin from the runtime**, so embedding the
   runtime can never drag authentication into an abusable context.
3. **Asymmetry by design:** the runtime is embeddable everywhere; the authenticated
   editor is never embeddable.

This is the same pattern Google (`googleusercontent.com`), GitHub
(`githubusercontent.com`), CodePen (`cdpn.io`) and Observable
(`*.observableusercontent.com`) use: user content runs on a separate, sacrificial
origin; the authenticated app lives where it can never execute.

## Core principle: origin isolation

Running arbitrary JS means that origin is, by definition, fully compromised — user
code can read all cookies, `localStorage`, IndexedDB, and make same-origin
credentialed requests. No CSP or `sandbox` trick contains arbitrary JS *within* an
origin (the product requires `unsafe-eval`, blob `import()`, arbitrary CDNs).

Therefore containment is **not** "make the JS safe" — it is **"make the runtime
origin worthless."** The runtime origin holds zero secrets, zero session, zero
privileged same-origin API. The session lives only where untrusted JS never runs.

## Trust zones (three origins)

| Zone | Origin | Holds | Embeddable? | Runs untrusted JS? |
|---|---|---|---|---|
| **Runtime** | `framejsusercontent.com` (separate registrable domain) | nothing — no auth, no cookies, no secrets | **Yes, anywhere** (`Content-Security-Policy: frame-ancestors *`) | Yes (by design) |
| **Editor / Auth** | `app.framejs.io` | the nhost session (JWT) | **No** (`frame-ancestors 'none'`) | **Never** |
| **API** | Hasura / nhost (`*.nhost.run` or proxied) | data + row-level permissions | n/a | No |

Rules that make this hold:
- **Bearer-token auth, not cookies, for all mutations.** nhost's default
  `Authorization: Bearer <jwt>` (access token in memory on the app origin) means
  there are no ambient credentials for any other origin to ride → CSRF does not
  apply. Never set domain-scoped (`Domain=.framejs.io`) cookies.
- **The runtime never holds or receives a token** — not in the URL, not via
  postMessage. Editing always happens on the app origin.
- **The editor is never framed** (`frame-ancestors 'none'` / `X-Frame-Options: DENY`).
- **No restrictive CSP on the runtime** (it would break user apps); isolation is the
  defense, not CSP. The runtime explicitly allows being framed.

## Threat model

| Threat | Vector | Mitigation |
|---|---|---|
| Session theft | user JS reads the token | Token exists only on the editor origin; runtime origin has no session, ever. |
| Clickjacking the editor | malicious site frames `app.framejs.io` over a destructive control | `frame-ancestors 'none'`; editor never framed. |
| CSRF on `/i/:uuid` update | credentialed cross-site request | Mutations use Bearer JWT in `Authorization` header, not cookies → no ambient creds. |
| Runtime escaping to the embedder | embedded app attacks the host page | Cross-origin iframe isolates DOM/storage; publish canonical embed snippet `sandbox="allow-scripts"` (no `allow-same-origin`, no `allow-top-navigation`). |
| Confused-deputy update | runtime tricked into mutating data | Runtime holds no token; public read path exposes no mutation; edits only in editor. |
| Brand/domain reputation | phishing/malware JS hosted; Safe Browsing flags origin | Separate registrable domain isolates flags from `framejs.io`. |
| Cross-app contamination | app A reads app B's runtime-origin `localStorage` / registers a rogue service worker | Treat shared runtime-origin storage as public; never serve user JS at a stable same-origin path (keep it in blob/hash so no rogue SW script can be hosted). Optionally isolate per-app (see decisions). |
| Stored injection via OG/SSR | user-controlled `og` fields injected into served HTML | HTML-attribute-escape all injected values (as the current `/j` handler does); contained anyway by the sacrificial origin. |
| Abuse of anonymous create | `/j` used as a free blob/JS host | Rate limits + size limits; abuse-report + takedown flow. |

## Immutable `/j` vs mutable `/i` — a security property, not just a feature

- **`/j/:sha256` is safe to embed by construction.** The hash pins the bytes; what
  was embedded is what runs forever. The owner cannot change it.
- **`/i/:uuid` is mutable → embedding it is a trust decision.** A benign embed can
  later have malicious JS swapped in by the owner (classic mutable-CDN supply-chain
  risk).

**Mitigation — version pinning on `/i`:** store a revision history; support
`/i/:uuid@<contentHash>` (or `?v=<sha>`) to resolve a specific immutable revision,
while bare `/i/:uuid` always serves latest. Owners get edit-in-place; cautious
embedders can pin.

## Visibility & how private content stays off the public path

Frame `visibility ∈ { private, unlisted, public }`.

- **The public runtime read path (`/i/:uuid`) only ever serves non-private rows.**
- **Private frames are viewable only inside the authed editor.** The editor fetches
  private code with the owner's JWT (Hasura), then feeds it to the runtime iframe via
  the **URL hash** (`…usercontent.com/#?js=…`) — stateless mode, no DB lookup; the
  fragment never reaches a server. Private code touches a server only at Hasura with
  the owner's token; the sacrificial origin runs it but never persists/sees it
  server-side.
- **Publishing** converts hash-mode → a stored `/i/:uuid` row.
- **An "edit" affordance in an embedded runtime must top-navigate**
  (`window.open` / `top.location`) to `app.framejs.io/i/:uuid/edit` — never embed a
  login, never pass a token into the frame.

## Create / auth boundaries

| Route | Create | Update | Anonymous read |
|---|---|---|---|
| `/j/:sha256` (immutable, ownerless) | **Anonymous OK** (keeps AI/CLI `/api/shorten/json`) | n/a (immutable) | Yes |
| `/i/:uuid` (mutable, owned) | **Auth required** (creator = owner) | **Auth required**, Hasura `user_id = X-Hasura-User-Id` | Only where `visibility != 'private'` |

## Topology: an "auth shell" that hosts the runtime as an iframe

The nhost app (the **shell**) owns identity and ownership; the runtime stays a
separate, near-stateless embedded surface — mirroring how the framejs runtime today
embeds its editor (URL-hash sync + metapage `postMessage`).

```
┌──────────── app.framejs.io  (SHELL — authenticated, NOT embeddable) ───────────┐
│  @nhost/react: <NhostProvider> + Apollo/urql (JWT auto-attached)               │
│  login / signup / session    "My Frames" dashboard ── GraphQL(JWT) ─► Hasura   │
│  edit/preview a frame:                                                          │
│     <iframe sandbox="allow-scripts" src="https://framejsusercontent.com/#?js="> │
│     (private code handed via hash; public frames via /i/:uuid or /j/:sha256)    │
└────────────────────────────────────────────────────────────────────────────────┘
        │ GraphQL (Bearer JWT)        │ Storage (JWT)         │ iframe (hash/postMessage; no token)
        ▼                             ▼                       ▼
   Hasura → Postgres            nhost Storage → S3      framejsusercontent.com (RUNTIME)
   (frames, ownership,          (uploaded input files)  - stateless; runs hash params
    visibility, revisions)                              - serves /j/:sha256, /i/:uuid
                                                        - no auth, no secrets, embeddable
```

postMessage discipline: always pin `targetOrigin` and verify `event.origin` between
shell and runtime; treat any inbound postMessage as untrusted data, never a
privileged operation.

## Data model (Hasura-tracked; `auth.users` provided by nhost)

```sql
create table public.frames (
  id           uuid primary key default gen_random_uuid(),  -- the /i/:uuid identifier
  user_id      uuid references auth.users(id) on delete cascade,  -- null = anonymous/legacy
  slug         text unique,
  content_hash text not null,           -- sha256 of current hash_params (idempotency + legacy /j redirect)
  hash_params  text not null,           -- the "#?js=...&inputs=..." blob (source of truth)
  title        text,
  og           jsonb,                   -- {title,description,image} for link previews
  visibility   text not null default 'private'
                 check (visibility in ('private','unlisted','public')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.frames (user_id);

-- Immutable revision history → enables /i/:uuid@<contentHash> pinning
create table public.frame_revisions (
  id           uuid primary key default gen_random_uuid(),
  frame_id     uuid not null references public.frames(id) on delete cascade,
  content_hash text not null,
  hash_params  text not null,
  created_at   timestamptz not null default now(),
  unique (frame_id, content_hash)
);
```

Hasura permissions:
- `select` on `frames`: `visibility != 'private'` **OR** `user_id = X-Hasura-User-Id`.
- `insert`/`update`/`delete` on `frames`: only where `user_id = X-Hasura-User-Id`.
- Anonymous/`public` role: `select` limited to `visibility != 'private'`.
- `frame_revisions`: `select` follows the parent frame's visibility; `insert` only by
  the owner (typically written server-side on save).

## Read paths

- **`/j/:sha256`** — immutable; resolve `sha256 → frame_revisions/legacy blob`,
  server/edge-inject OG + serve runtime HTML (current behavior).
- **`/i/:uuid`** (optionally `@<contentHash>`) — server/edge function on the runtime
  origin resolves the row via Hasura (server-side; non-private only), injects OG,
  serves runtime HTML. The runtime browser makes **no** API call → minimal client
  API surface, crawler/OG friendly.
- **Private preview** — never via these routes; the shell feeds code to the runtime
  iframe through the URL hash.

## nhost service mapping

| Concern | nhost |
|---|---|
| Login / signup / session / JWT | nhost Auth (email/password, magic link, OAuth); access token in memory on app origin, refresh handled by SDK |
| Authorization | Hasura JWT claims (`x-hasura-user-id`, roles) + row permissions above |
| Frames CRUD / read API | Hasura GraphQL from the shell (Bearer JWT) |
| Uploaded input files | nhost Storage (public bucket for embeddable inputs; permissioned for private) |
| Short-URL minting (sha256/slug), QR codes, OG injection, `/i` SSR, anonymous AI/CLI create | nhost Functions (or keep on Deno Deploy / Cloudflare at the runtime origin) |
| Analytics | Umami (independent of nhost), called from shell and/or a Function |

## Decisions (defaults — revisit if needed)

1. **Runtime on a separate registrable domain** (e.g. `framejsusercontent.com`), not
   a subdomain — eliminates cookie `Domain`-scoping risk and isolates reputation
   flags from the brand domain.
2. **Shared runtime origin to start**, but design URLs so we can move to **per-app
   origins** (`<id>.framejsusercontent.com`, wildcard TLS) later if app-to-app
   isolation becomes a requirement.
3. **Version pinning supported** on `/i/:uuid` via immutable revisions.
4. **Public read path is server/edge-injected** (runtime browser makes no API call).
5. **Anonymous create stays for `/j`** (immutable, ownerless); **auth required for
   `/i`** create/update.

## Open items to track

- Abuse / moderation / takedown flow and rate limits (anonymous create is a public
  blob/JS host).
- Per-user quota / billing.
- Migration of the existing immutable `j/<sha256>` corpus (backfill rows vs redirect
  by `content_hash`).
- Whether the unauthenticated AI/CLI mint path produces anonymous frames or gets a
  system owner.
```
</content>
