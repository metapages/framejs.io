---
name: framejs-css-sync
description: >
  How this repo's visual style (the editor AND the docs) is derived from
  framejs.app's design system, and the exact steps to re-merge it when
  framejs.app changes. Load whenever restyling the editor or docs, updating
  palette/fonts/tokens, syncing the "Offprint" look from the framejs-nhost
  sibling repo, or editing editor/src/styles/blueprint.css, theme.ts, or
  docs/.vitepress/theme/blueprint.css.
---

# framejs.io ⇐ framejs.app design system ("Offprint")

This repo's surfaces are **styled to copy framejs.app**, not invented here.
framejs.app (the `framejs-nhost` sibling repo) owns the design system; we mirror
it so everything reads as one product. See [[framejs-origins]] for the repo split.

Two surfaces mirror it, each with its own bridge because each uses a different
framework:

| Surface  | Framework            | Bridge file                             |
| -------- | -------------------- | --------------------------------------- |
| Editor   | Chakra UI v2 (React) | `editor/src/styles/theme.ts`            |
| Docs     | VitePress            | `docs/.vitepress/theme/blueprint.css`   |

The rest of this doc covers the **editor** first, then the **docs**.

**Design language:** "Offprint" — bone stock (`#f4f3ef`), near-black ink
(`#111110`), one vermillion (`#c9350a`), rules and space in place of cards, cut
2px corners. IBM Plex **Serif** (headings) + Sans (body/chrome) + Mono
(labels/wordmark/data/code).

> **Migration status (2026-08-30).** framejs.app replaced its previous
> "Blueprint / drafting table" world — cobalt `#1f2edb` accent, two-axis drafting
> grid, 3–4px radii — because the cobalt sat in the indigo band and read as
> AI-generated. **The docs mirror has been migrated. The editor mirror has
> not**: `editor/src/styles/blueprint.css`, `theme.ts` and `editor/index.html`
> still carry the cobalt palette. Both mirrors are still *named* `blueprint.css`
> for now; rename them together once the editor catches up.

**What the editor still needs** (the full re-merge checklist below applies):
swap the token hexes in `blueprint.css` **and** the mirrored `const` block in
`theme.ts`, copy the three `ibm-plex-serif-*` woff2 into `editor/public/fonts/`,
set headings to the serif, drop radii to 2px, retint shadows to
`rgba(32,26,18,…)`, and change `editor/index.html`'s `theme-color` from
`#fbfaf7` to `#f4f3ef`.

## The core tension

- **framejs.app** is **Tailwind v4 + Preact (Deno Fresh)**. Its entire design
  system is one file: `assets/styles.css` (CSS custom properties + `@theme inline`
  Tailwind mapping + component classes `.btn`/`.plate`/`.eyebrow`/`.field` + fonts).
- **This editor** is **Chakra UI v2 + React (Vite)**. No Tailwind.

So we can't share the file verbatim. Instead we mirror the **tokens, component
classes, and fonts** as plain CSS, and bridge Chakra to the same values.

## Source of truth (in the sibling repo)

| What            | Path (in `framejs-nhost`)                                  |
| --------------- | ---------------------------------------------------------- |
| Stylesheet      | `frontend/worker/assets/styles.css`                        |
| Fonts (9 woff2) | `frontend/worker/static/fonts/ibm-plex-*.woff2`            |
| HTML shell/theme| `frontend/worker/routes/_app.tsx` (theme-color, data-theme)|

Sibling repo root on this machine: `/Users/dion/dev/git/metapages/framejs-nhost`.

## Where it lands here

| File                                | Role                                                       |
| ----------------------------------- | ---------------------------------------------------------- |
| `editor/src/styles/blueprint.css`   | Plain-CSS mirror of `styles.css` — tokens + classes + fonts|
| `editor/public/fonts/*.woff2`       | The IBM Plex woff2, served by Vite at `/fonts/`            |
| `editor/src/styles/theme.ts`        | Chakra bridge: maps blueprint token values onto Chakra     |
| `editor/src/index.tsx`              | `import "/@/styles/blueprint.css"`                         |
| `editor/index.html`                 | `<html data-theme="light">` + `theme-color` = `#fbfaf7`    |

## How `styles.css` → `blueprint.css` (the transform)

`blueprint.css` is `styles.css` with the Tailwind-only bits removed. When
re-merging, apply exactly these transforms and copy everything else **verbatim**:

1. **Drop** the first line `@import "tailwindcss";`.
2. **Drop** the `@theme inline { … }` block (it only generates Tailwind
   utilities). BUT preserve the non-color tokens it defines by adding them to
   `:root` as plain custom properties: `--font-sans`, `--font-mono`,
   `--radius-plate`, `--radius-control`, `--ease-out`.
3. **Unwrap** the `@layer base { }`, `@layer components { }`,
   `@layer utilities { }` wrappers into plain rules. (Emotion injects Chakra's
   styles unlayered, which would out-prioritize layered rules — so don't keep the
   layers.)
4. **Move `body { background/color }` out.** Chakra's CSS reset sets the body
   bg/color and wins by injection order, so the paper/ink body styles live in
   `theme.ts` `styles.global`, not here. Keep `::selection` and `:focus-visible`.
5. **Keep verbatim:** all `@font-face` blocks (paths are `/fonts/…`, same as
   framejs.app), the full `:root` light palette, the dark palette blocks (kept
   dormant — see below), and the component classes `.eyebrow`/`.btn*`/`.field`/
   `.plate`/`.bg-grid`/`.ticks`/`.tabular`.

Hero-specific animation classes (`.hero-plot*`, `.live-dot`, `.overlay-in`,
`.panel-in`) are framejs.app landing-page-only — omit them here unless a matching
component is added.

## The Chakra bridge (`theme.ts`)

Chakra can't consume `.btn`/`.plate` classes, so `theme.ts` remaps Chakra's own
scales onto the blueprint neutrals + accent and sets the fonts:

- `fonts.body/heading` → IBM Plex Sans; `fonts.mono` → IBM Plex Mono.
- `colors.gray.{50..900}` → blueprint neutrals (surface / surface-2 / line /
  line-strong / ink-3 / ink-2 / ink), so existing components (header, panels,
  dividers that use `gray.*`) adopt the palette with no per-component edits.
- `colors.blue.{...}` → cobalt accent (`--accent` / `--accent-hover` / `--accent-soft`).
- `borders."1px"` → warm hairline (`--line`) so `borderBottom="1px"` follows.
- `styles.global.body` → paper bg + ink text.

> **Important:** `theme.ts` uses **literal hex**, NOT `var(--token)`. Chakra runs
> build-time color math (`transparentize`, etc.) that chokes on CSS variables.
> This means token **values are duplicated** between `blueprint.css` (`:root`) and
> the `const` block at the top of `theme.ts`. When a hex value changes upstream,
> update **both**.

## Re-merge checklist (when framejs.app's style changes)

1. `diff <(sed …) …` — compare the sibling `assets/styles.css` against our
   `editor/src/styles/blueprint.css` to see what moved. (They won't match line-for
   -line because of the transforms above; scan for changed **token values**, new
   **component classes**, and new **@font-face**.)
2. Re-apply the transforms in "How styles.css → blueprint.css" for any changed/new
   rules.
3. **If any color token hex changed:** update the mirrored `const` in `theme.ts`
   to match. This is the easiest step to forget.
4. **If fonts were added/changed:** copy the new woff2 from the sibling
   `static/fonts/` into `editor/public/fonts/`.
5. **If theme-color / data-theme default changed:** update `editor/index.html`.
6. `just check` (types), then visually verify — run the stack and screenshot the
   editor header + Settings panel. The editor is embedded at `/editor/`; see
   [[framejs-origins]] for the local dev URL. (If the editor window is blank after
   a git op, that's the bind-mount gotcha, not CSS — recreate the editor container.)

## Surface: docs (VitePress)

The docs (`docs/`, VitePress with the default theme) get the blueprint look by
overriding VitePress's own `--vp-*` CSS variables — you never touch Chakra here.

**Files:**

| File                                       | Role                                             |
| ------------------------------------------ | ------------------------------------------------ |
| `docs/.vitepress/theme/blueprint.css`      | Design tokens + `--vp-*` mapping (light+dark)    |
| `docs/.vitepress/theme/fonts/*.woff2`      | The 9 IBM Plex woff2 (serif + sans + mono)        |
| `docs/.vitepress/theme/index.ts`           | `import "./blueprint.css"`                        |
| `docs/.vitepress/theme/HomeLayout.vue`     | Hero URL callout set to `--vp-font-family-mono`  |

**How it works:**

1. `blueprint.css` declares the framejs.app tokens twice: light in `:root`, dark
   in `.dark` (VitePress's dark-mode class). Unlike the editor, **docs support
   both modes** — VitePress has a built-in appearance toggle and framejs.app
   ships both palettes, so wire both.
2. It then maps VitePress variables onto the tokens (here `var(--token)` is safe —
   no Chakra color math): surfaces (`--vp-c-bg{,-alt,-soft,-elv}`), text
   (`--vp-c-text-{1,2,3}`), hairlines (`--vp-c-border`/`-divider`/`-gutter`),
   brand→accent (`--vp-c-brand-{1,2,3}`, `-soft`), brand buttons, and the home
   hero name (`--vp-home-hero-name-color` = accent, `-background` = transparent to
   kill the default gradient). Fonts via `--vp-font-family-{base,mono}`.
3. A few structural rules restore the cut-corner feel VitePress otherwise rounds
   heavily: `.VPButton`, `.VPFeature`, code blocks → `--radius-control/plate`.
4. **Remap VitePress's own neutral scale.** `--vp-c-gray-{1,2,3,soft}` and
   `--vp-c-default-{1,2,3,soft}` are blue-biased out of the box and back every
   "default" surface (alt buttons, custom blocks, badges). Left alone they put
   lilac-gray chips on bone paper. They are pointed at the warm tokens, and the
   alt-button vars are set to reproduce framejs.app's `.btn-secondary` (plate
   fill + `line-strong` hairline) rather than a filled gray chip.
5. **The serif is scoped**, not global: `.vp-doc` headings, `.VPHero .name/.text`
   and `.VPFeature .title` only. Nav and sidebar stay sans — in framejs.app the
   chrome is sans/mono and only headings take the serif. Hero weight is forced
   to 600 (VitePress ships 900; nothing in the system passes 600).

**Two deliberate docs-only divergences:**

- `--warning-soft` is declared here but does **not** exist in framejs.app —
  nothing there needs a warning fill, and VitePress's warning container does. It
  used to point at the *green* wash, which was simply a bug.
- VitePress's "tip" container is mapped to `--ink-2` / `--surface-2`, not the
  accent. A tip is an aside, not an action; on the accent it made vermillion the
  loudest thing on a page of prose, breaking the one-bold-move rule.

**Fonts — the base-path catch:** docs run under `base: "/docs/"` (config.ts), so a
root-absolute `/fonts/…` would resolve to the site root, not `/docs/`. So the docs
fonts are **co-located in `theme/fonts/` and referenced relatively**
(`url("./fonts/…")`) — Vite processes them and rewrites to the correct
`/docs/assets/…` hashed URL. (This differs from the editor, which serves fonts
from `public/fonts/` at `/fonts/`.) Validate with `just docs/build` and grep the
built `dist/assets/*.css` for `url(/docs/assets/ibm-plex-…)`.

**Re-merge for docs:** same idea as the editor checklist — diff the sibling
`styles.css`, and if token **values** changed, update them in
`docs/.vitepress/theme/blueprint.css` `:root`/`.dark`. Because the `--vp-*`
mapping uses `var(--token)` (not hex), only the token declarations need editing,
not the mapping. Verify with `npm run build` in `docs/` + a visual check of the
home page and one content page in both light and dark.

Two things that only surface at build/preview time:

- Grep the built CSS for the font URLs — `grep -o "url(/docs/assets/ibm-plex-[^)]*)"
  .vitepress/dist/assets/*.css` should list all nine faces. A face that fails the
  base-path rewrite silently falls back to Georgia/system.
- `npm run preview` + Playwright: the home page embeds a live framejs.io iframe
  that never goes idle, so screenshot with `waitUntil: "domcontentloaded"` and a
  fixed wait. `networkidle` will always time out there.

## Deliberate divergences (don't "fix" these)

- **Light-only.** `editor/index.html` pins `data-theme="light"`, so the dark
  palette in `blueprint.css` never activates. It's kept verbatim (dormant) so a
  future theme toggle can match framejs.app in one step. framejs.app itself is
  3-way (System/Light/Dark).
- **Text inputs** keep the external `@metapages/metaframe-chakra-theme` package's
  `#ECECEC !important` background — it can't be overridden cleanly from `theme.ts`.
  Not blueprint-warm, but low-priority; changing it needs a full Chakra `Input`
  override or editing the package.
- **Code editor pane** is an external Monaco metaframe (`editor.mtfm.io`) with its
  own styling — out of scope for this sync.
