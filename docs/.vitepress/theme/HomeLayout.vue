<script setup>
import DefaultTheme from 'vitepress/theme';

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #home-hero-image>
      <div class="hero-iframe-container">
        <iframe
          src="https://framejs.io/j/019f2b53304f788d9fe1d00556489768"
          class="hero-iframe"
          frameborder="0"
          allow="clipboard-read; clipboard-write"
        ></iframe>
        <p class="hero-tagline-line">
          URL: <a href="https://framejs.io/j/019f2b53304f788d9fe1d00556489768"><span class="highlight">https://framejs.io/j/8e5d5eed5c...</span></a>
        </p>
        <p class="hero-tagline-line">
          The URL shareable and editable <span class="highlight"><a href="/docs/guide/ai">(with AI)</a></span> 
        </p>
      </div>
    </template>
  </Layout>
</template>

<style>
.hero-iframe-container {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  padding: 16px;
  padding-left: 32px;
}

.hero-iframe {
  width: 100%;
  height: 400px;
  border: 1px solid var(--vp-c-border);
  border-radius: var(--radius-plate, 2px);
}

/* Below 960px VitePress stacks the hero and gives `.image` order:1 — ABOVE
   `.main` — while sizing that block itself (320px, or 392px from 768px up,
   plus negative margins) no matter what the `home-hero-image` slot renders.
   Hiding only our own wrapper therefore left VitePress's box behind as an
   empty ~390px band above the hero name. Collapse the whole `.image` block
   instead, which is what "no demo frame on narrow screens" actually means. */
@media (max-width: 959px) {
  .VPHero.VPHomeHero .image {
    display: none;
  }
}

@media (min-width: 960px) {
  .hero-iframe {
    height: 500px;
  }
}

.hero-tagline-line {
  margin: 0;
  padding-top: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* Shareable URLs / data callouts render in IBM Plex Mono. */
  font-family: var(--vp-font-family-mono);
}

.hero-tagline-line .highlight {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
</style>
