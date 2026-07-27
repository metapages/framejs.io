---
layout: home

hero:
  name: framejs.io
  text: Share interactive visualizations in a URL
  tagline: Create interactive charts, dashboards, and apps in the browser — the code lives in the URL, so anyone with the link can run it. No server, no build, no account. Generate with AI or write by hand, then embed or share anywhere.
  actions:
    - theme: brand
      text: Quickstart
      link: /quickstart
    - theme: brand
      text: Use it in Claude
      link: /integrations/claude-mcp
    - theme: alt
      text: Intro
      link: /guide/intro
    - theme: alt
      text: Create new
      link: https://framejs.io#?edit=true
    - theme: alt
      text: Latest slides
      link: /presentations/2026-07-omsf-office-hours/
      target: _blank

features:
  - title: Use it in Claude — no install
    details: |
      Paste one connector URL into Claude Desktop, web, or mobile. Claude then builds, edits, and finds your visualizations in the conversation. No terminal, no build, nothing to download.
    link: /integrations/claude-mcp
    linkText: Add the connector
  - title: Edit with AI in your coding agent
    details: |
      One-line skill install for Claude Code, Cursor, Gemini CLI and ~40 others — describe what you want, and reference local files.
    link: /guide/ai
  - title: Share via URL
    details: All state is embedded in the URL — no server storage. Copy the link and anyone can run your code.
    link: /guide/url-state
  - title: Notebook Widgets
    details: Use any metaframe as an interactive Jupyter or marimo widget with the metaframe-widget Python package. Visualizations from notebooks preserve state like visualization inputs.
    link: /integrations/jupyter
  - title: Connect Metaframes
    details: Wire inputs and outputs between metaframes to build apps, workflows, and dashboards.
    link: /guide/overview
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
