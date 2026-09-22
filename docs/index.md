---
layout: home

hero:
  name: framejs.io
  text: Open web artifacts, yours to embed anywhere
  tagline: >-
    Same idea as a Claude or ChatGPT artifact — one file of browser code that
    just runs. Except this one is a URL of its own: embed it live in a notebook,
    paper, or slide, wire it to data, cite an exact version, fork it, self-host
    it. Open source, and nobody needs an account to open what you made.
  actions:
    - theme: brand
      text: Intro
      link: /guide/intro
    - theme: alt
      text: Quickstart
      link: /quickstart
    - theme: brand
      text: Use it in Claude
      link: /integrations/claude-mcp
    - theme: alt
      text: Create new
      link: https://framejs.io#?edit=true
    - theme: alt
      text: Slide deck
      link: /presentations/2026-07-omsf-office-hours/
      target: _blank

features:
  - title: Use it in Claude — no install
    details: |
      Paste one connector URL into Claude Desktop, web, or mobile. Claude builds and edits your artifacts in the conversation — and each one leaves the chat as a link that runs on its own. No terminal, nothing to download.
    link: /integrations/claude-mcp
    linkText: Add the connector
  - title: Edit with AI in your coding agent
    details: |
      One-line skill install for Claude Code, Cursor, Gemini CLI and ~40 others — describe what you want, and reference local files.
    link: /guide/ai
  - title: The URL is the artifact
    details: Code and state both live in the URL — no server copy, nothing to deploy. Copy the link and anyone can run it, exactly as you left it.
    link: /guide/url-state
  - title: Embed it live, anywhere
    details: One iframe drops the running artifact into a paper, an LMS, a docs site, or a slide. Not a screenshot and not an export — the real thing, still interactive.
    link: /guide/embedding
  - title: Notebook Widgets
    details: Use any metaframe as an interactive Jupyter or marimo widget with the metaframe-widget Python package. Values pass both ways, so your Python and the artifact stay in step.
    link: /integrations/jupyter
  - title: Connect Metaframes
    details: Wire inputs and outputs between metaframes, so several artifacts compose into an app, a workflow, or a dashboard instead of sitting in separate links.
    link: /guide/overview
  - title: Open source, and yours to host
    details: The rendering runtime is MIT-licensed and the URL format is documented. Fork it, run it inside your own network, and every artifact keeps working.
    link: /blog/open-infrastructure
---

<div class="home-video">

## See it in 1 minute

<YouTube id="7brz6Z111Eo" vertical title="framejs.io in 1 minute" />

<p class="home-video-link"><a href="/docs/quickstart">Quickstart &rarr;</a></p>

</div>

<style>
.home-video {
  padding-bottom: 64px;
  text-align: center;
}

/* The features grid above already provides the separation, so drop VitePress'
   default h2 divider rule and keep just the breathing room. */
.home-video h2 {
  border-top: none;
  margin: 0 0 8px;
  padding-top: 0;
  font-size: 24px;
  letter-spacing: -0.02em;
}

.home-video-link a {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}
</style>
