<script setup>
// Lightweight responsive YouTube embed.
//   <YouTube id="7brz6Z111Eo" />              → 16:9 landscape
//   <YouTube id="7brz6Z111Eo" vertical />     → 9:16 Shorts, width-capped
// Uses youtube-nocookie.com so no tracking cookie is set until the user plays.
const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, default: "YouTube video" },
  // Shorts are vertical; cap their width so they don't tower down the page.
  vertical: { type: Boolean, default: false },
});
</script>

<template>
  <div class="yt-embed" :class="{ vertical }">
    <div class="yt-frame">
      <iframe
        :src="`https://www.youtube-nocookie.com/embed/${id}?rel=0`"
        :title="title"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.yt-embed {
  margin: 20px 0;
}
/* Vertical (Shorts): cap width, center, keep it from dominating the page. */
.yt-embed.vertical .yt-frame {
  max-width: 320px;
  margin-inline: auto;
  aspect-ratio: 9 / 16;
}
/* Landscape default. */
.yt-frame {
  position: relative;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--vp-c-border);
  border-radius: var(--radius-control, 6px);
  overflow: hidden;
}
.yt-frame iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
