---
name: framejs-css-sync
description: >
  How this repo's visual style (the editor AND the docs) is derived from
  framejs.app's design system, and the exact steps to re-merge it when
  framejs.app changes. Load whenever restyling the editor or docs, updating
  palette/fonts/tokens, syncing the "blueprint" look from the framejs-nhost
  sibling repo, or editing editor/src/styles/blueprint.css, theme.ts, or
  docs/.vitepress/theme/blueprint.css.
---

# framejs.io ⇐ framejs.app design system ("blueprint")

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

**Design language:** "Blueprint / drafting table" — warm technical paper ground,
cobalt blueprint ink accent, hairline warm-gray rules, low radii (3–4px), IBM
Plex Sans (body/chrome) + IBM Plex Mono (labels/wordmark/data/code).

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
| Fonts (6 woff2) | `frontend/worker/static/fonts/ibm-plex-*.woff2`            |
| HTML shell/theme| `frontend/worker/routes/_app.tsx` (theme-color, data-theme)|

Sibling repo root on this machine: `/Users/dion/dev/git/metapages/framejs-nhost`.

## Where it lands here

| File                                | Role                                                       |
| ----------------------------------- | ---------------------------------------------------------- |
| `editor/src/styles/blueprint.css`   | Plain-CSS mirror of `styles.css` — tokens + classes + fonts|
| `editor/public/fonts/*.woff2`       | The 6 IBM Plex woff2, served by Vite at `/fonts/`          |
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
| `docs/.vitepress/theme/blueprint.css`      | Blueprint tokens + `--vp-*` mapping (light+dark) |
| `docs/.vitepress/theme/fonts/*.woff2`      | The 6 IBM Plex woff2                              |
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
3. A few structural rules restore the low-radius plate feel VitePress otherwise
   rounds heavily: `.VPButton`, `.VPFeature`, code blocks → `--radius-control/plate`.

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
not the mapping. Verify with `just docs/build` + a visual check of the home page
and one content page in both light and dark.

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
