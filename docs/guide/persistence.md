# Persistence & Data Retention

framejs is built on a simple idea: **the URL _is_ the program.** Everything a
Frame needs to run is carried in the link itself, so the most durable thing you
can own is the URL you already hold. On top of that, framejs offers optional,
account-backed storage for when you want the platform to keep a copy for you.

This page describes exactly how long each kind of URL persists, and how content
ages out over time.

## The two apps

framejs is two cooperating services with different jobs:

| App | Role | State |
|-----|------|-------|
| **[framejs.io](https://framejs.io)** | The open-source **rendering runtime**. Serves the page, runs your code, mints content-addressed short URLs. | Stateless — content lives in the URL or a content-addressed blob |
| **[framejs.app](https://framejs.app)** | The optional **accounts & persistence** layer. Owns durable, versioned, shareable *Frames*. | Postgres-backed, per-user |

The rendering runtime and the content-addressed URL persistence at framejs.io
are **free and open source, forever** — see [Open Infrastructure &
FAIR](/story/open-infrastructure). framejs.app adds durable, guaranteed
persistence as an optional supported service.

## The four kinds of URL

There are four ways a Frame can be addressed, from most self-contained to most
managed. **The more the platform stores for you, the longer we keep it.**

### 1. Full hash URL — `framejs.io/#?js=…`

The entire program is encoded in the URL hash. **Nothing is stored on any
server.** This URL persists for exactly as long as *you* keep it — in a
bookmark, a document, a message. There is no copy to expire, and no copy anyone
else can query. It works forever, offline-friendly, and is the most private
option (see [Why](/story/why)).

### 2. Content-addressed short URL — `framejs.io/j/<sha256>`

When a hash URL gets long, [Create expiring snapshot](/guide/short-urls) stores the hash
params as an immutable blob in object storage, keyed by the SHA-256 of their
content, and gives you a compact `framejs.io/j/<sha256>` link. The same content
always produces the same hash.

These are a **free convenience snapshot, kept on a best-effort basis for ~30
days** and then garbage-collected. They are ideal for quick sharing, previews,
QR codes, and paste-into-chat links. They are **not** the place to store
something you need to keep — for that, save it to a Frame (below).

::: warning Short URLs are ephemeral
`framejs.io/j/<sha256>` links are free and expire after about a month. If you
need a link that lasts, create an account-backed **Frame** on
[framejs.app](https://framejs.app), which keeps a durable, guaranteed copy.
:::

### 3. Durable Frame — `framejs.app/j/<uuid>`

A **Frame** is an account-owned document with a stable UUID. Its content is a
history of versions — editing appends a new version rather than overwriting, so
you get free version history. A Frame is **durable and guaranteed to persist
while your account is active** (a free tier is included).

The `<uuid>` always resolves to the **current** version of the Frame. Because a
Frame is mutable, its history ages out on a **human-friendly** schedule (see
[How data ages out](#how-data-ages-out)) — the current version is always kept.

### 4. Published version — `framejs.app/j/<uuid>?v=<sha256>`

Every version of a Frame has its own content hash. **Publishing** a version
(from the Frame menu → **Publish version**) pins the URL to that exact, immutable
snapshot at `?v=<sha256>`, even as the Frame keeps evolving. This is the way to
hand someone a link that will show precisely what you see today, forever.

A published version is **permanently public and citable — like a DOI**. Once you
publish it, that exact snapshot keeps resolving **even if you later make the Frame
private or delete it** (much like a public commit or gist on GitHub). You publish
from a **public** Frame, and the pin stays public for the long haul on the
**"human-permanent" lifecycle**. Publishing is a **Pro** capability (it's part of
the optional persistence service that funds the free, open core).

Both apps serve it: `framejs.app/j/<uuid>?v=<sha256>` renders the pinned version
in the account UI (with a link back to the latest version), and
`framejs.io/j/<uuid>?v=<sha256>` renders the same snapshot on the runtime.

> **Status:** shipped. Open a public Frame, choose **Publish version**, and share
> the `?v=` link. The current version at `framejs.app/j/<uuid>` is always
> available too.

## Retention at a glance

| URL / data | App | Mutable? | Retention |
|------------|-----|----------|-----------|
| Full hash URL `#?js=…` | framejs.io | — | **Forever** — no server copy; you hold it |
| Short URL `/j/<sha256>` | framejs.io | No | **~30 days**, best-effort, then garbage-collected |
| Uploaded file `/f/<sha256>` | framejs.io | No | **~30 days**, best-effort (same free tier as short URLs) |
| Frame (current version) `/j/<uuid>` | framejs.app | Yes | **Durable while the account is active** (free tier included) |
| Frame version history | framejs.app | Append-only | Current version always kept; **older versions pruned after 12 months** (published versions exempt) |
| Published version `?v=<sha256>` (Pro) | framejs.app | No | **Permanent ("human-permanent")** — stays public even if the Frame is later made private or deleted |
| Anonymous (unclaimed) Frame | framejs.app | Yes | **90 days**, then garbage-collected if never claimed by an account |
| Soft-deleted Frame | framejs.app | — | Hidden immediately; **hard-deleted after a 30-day recovery window** |

::: tip
All windows above are **best-effort minimums** and are deliberately
human-friendly — if we ever tighten them we will only do so with clear notice,
and we will always favour keeping content longer rather than shorter.
:::

## How data ages out

The platform ages out data in a small number of predictable ways:

- **Free content-addressed URLs (`/j/<sha256>`, `/f/<sha256>`) expire after
  ~30 days.** They are content-addressed, so re-saving the identical content
  simply mints the same URL again. Nothing you can reconstruct from a hash URL
  is ever truly lost.
- **Anonymous Frames** you create while logged out live for **90 days**. Sign
  in and **claim** one at any time within that window to make it a durable,
  owned Frame; otherwise it is garbage-collected.
- **Frame version history** is pruned after **12 months** to keep histories
  tidy. The **current** version is always retained, and any version you have
  **published** (`?v=<sha256>`) is exempt from pruning.
- **Deleting a Frame is a soft delete first.** It disappears from your dashboard
  immediately but is recoverable for **30 days**, after which it is permanently
  removed along with its versions.
- **Closing your account** removes your Frames and personal data on the same
  30-day schedule. Published versions others depend on are retained as
  ownerless content to keep shared links working.

Because the URL is the program, the strongest guarantee is always the one you
control yourself: **keep the full hash URL** and your Frame is truly permanent,
no platform required.

## The API that connects the two apps

The two apps are linked by a small, open HTTP surface. The rendering runtime
provides content-addressed storage; the accounts layer wraps that content in
durable, owned Frames.

### framejs.io — content-addressed storage

| Endpoint | Purpose |
|----------|---------|
| `POST /api/shorten` | Store hash params, get a `/j/<sha256>` short URL. See [Short URLs](/guide/short-urls). |
| `POST /api/shorten/json` | Same, encoding `{js, options, …}` into hash params for you. |
| `GET /api/j/:sha256` | Retrieve decoded hash params for a short URL. |
| `GET /api/j/:sha256/url` | Retrieve the full URL as plain text. |
| `POST /api/upload/presign` | Presigned URL for direct browser→storage file upload (`/f/<sha256>`). |
| `GET /f/:sha256` | Download a content-addressed uploaded file. |

### framejs.app — durable Frames

| Endpoint | Purpose |
|----------|---------|
| `GET /j/<uuid>` | Render the current version of a Frame (public Frames need no auth). |
| `GET /j/<uuid>.json` | Fetch the current version's hash params as JSON (public, read-only). |
| GraphQL (Hasura) | Authenticated create / edit (append version) / soft-delete, scoped per user by row-level permissions. |
| Frame API tokens | Scoped, optionally expiring tokens for programmatic writes to a Frame. |

**How a Frame "connects" a URL:** saving in the framejs.app editor takes the
current framejs.io hash params — the same content you could shorten to a free
`/j/<sha256>` — and persists them as a new **durable version** of your Frame.
In other words, framejs.app is the managed, owned counterpart to framejs.io's
ephemeral content-addressed URLs. You can always move down the durability ladder
(export a Frame version to a hash URL you hold yourself) or up it (save a hash
URL into a Frame for guaranteed persistence).

See [Open Infrastructure & FAIR](/story/open-infrastructure) for how these
retention commitments map to the FAIR data principles and our open-source
pledge.
