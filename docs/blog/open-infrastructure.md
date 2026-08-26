# Open Infrastructure & FAIR

framejs is infrastructure, not a walled garden. The core primitive — a URL that
carries an editable program and renders it anywhere — only earns trust if it is
open, and if the things you make with it stay reachable. This page is our
commitment on both counts.

## The open-source pledge

The **core is free and open source, and will stay that way.** Specifically, we
commit that:

- The **rendering runtime** — the page that runs your code from the URL hash —
  is and will remain open source under the [MIT
  license](https://github.com/metapages/framejs.io/blob/main/LICENSE).
- The **content-addressed URL persistence** at `framejs.io` (`/j/<sha256>`
  short URLs and `/f/<sha256>` files) is part of that free core.
- The URL format, the [metaframe protocol](https://docs.metapage.io/), and the
  client libraries are open, documented, and yours to build on.

This is a forward-looking promise, not just a description of today. The primitive
should be as dependable as a web standard: if `https://framejs.io/#?js=…` runs
your code now, it should run it in ten years, on infrastructure anyone can
inspect, fork, or self-host.

**[framejs.app](https://framejs.app)** is how we sustain that. It adds durable,
guaranteed, account-backed persistence and connected Frames as an **optional
supported service**. The revenue from optional persistence funds the free,
open core — it never gates it. You never need an account, a subscription, or
our servers to create, run, edit, embed, or share a Frame.

## Why "self-contained" is the whole strategy

Because a Frame is complete in itself — code, state, inputs, all in the URL — it
is portable *and* private at the same time (see [Why](/story/why)). That same
property is what makes it good open infrastructure: there is no proprietary
runtime you must call home to, no database schema you are locked into, no
account that owns your work. The most durable copy of anything you make is the
URL you already hold.

Optional persistence is a convenience layered *on top* of that self-contained
core, never a replacement for it.

## FAIR data

We align framejs with the
[**FAIR data principles**](https://www.openaire.eu/how-to-make-your-data-fair) —
that data should be **F**indable, **A**ccessible, **I**nteroperable, and
**R**eusable. The URL-as-program model is a remarkably good fit.

### Findable

- Every saved artifact has a **persistent identifier**: a content-addressed
  SHA-256 for short URLs and files, a stable UUID for Frames, and a published
  `?v=<sha256>` hash for an exact, permanent version.
- Frames carry **Open Graph metadata** (title, description, image), so links are
  self-describing wherever they are shared, and each has a scannable QR code.

### Accessible

- Content is retrievable over **plain, open HTTP** by its identifier, with no
  proprietary client required — `GET /api/j/:sha256`, `GET /j/<uuid>.json`, and
  friends (see [the API](/guide/persistence#the-api-that-connects-the-two-apps)).
- Public content needs **no authentication**. The runtime that serves it is
  open source, so access never depends on a single vendor staying online.
- Where content ages out, it does so on **published, human-friendly schedules**
  (see [Data Retention](/guide/persistence)) — access rules are transparent, not
  surprises.

### Interoperable

- Everything is built on **standard web technology**: the URL hash, base64/JSON
  encodings, and iframes. A Frame embeds in Notion, Obsidian, Confluence,
  Jupyter, or any website with no special integration.
- Frames speak the open **[metaframe/metapage
  protocol](https://docs.metapage.io/)**, so they wire inputs and outputs into
  each other and into other tools.

### Reusable

- The **MIT license** and self-contained format mean anyone can view, fork,
  edit, embed, or self-host any Frame — the code is right there in the URL.
- **Immutable, content-addressed versions** give clear provenance: a published
  `?v=<sha256>` link always shows exactly the content it names, permanently.
- Frames are **editable in place**, so reuse is the default: open someone's
  link, change it, and share your own — no accounts, no gatekeeping.

## Our commitments, by property

| | framejs.io (free core) | framejs.app (optional persistence) |
|--|------------------------|-------------------------------------|
| **License** | MIT, open source, permanent | Hosted service; open client libraries |
| **Accounts** | Never required | Optional (free tier included) |
| **Persistence** | Content-addressed URLs kept ~30 days; hash URLs you hold last forever | Durable Frames; published versions kept permanently ("human-permanent"), even after the Frame goes private or is deleted |
| **Findability** | SHA-256 identifiers, Open Graph, QR | Stable UUIDs, published `?v=` versions, dashboards |
| **Access** | Public, no auth, open runtime | Public read via `/j/<uuid>.json`; owner-scoped writes |
| **Portability** | Self-hostable; URL is the source of truth | Export any version back to a self-contained URL |
| **FAIR** | Findable · Accessible · Interoperable · Reusable | Adds durable, citable, long-term identifiers |

For the exact retention windows behind these commitments, see
[Persistence & Data Retention](/guide/persistence).
