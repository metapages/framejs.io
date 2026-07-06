<script setup>
// Reusable "browser window" chrome around a framejs visualization.
// Renders traffic-light dots + an address bar (linking to the live app) and
// embeds the given URL in an iframe. Pass a default slot to override the body.
const props = defineProps({
  // URL to embed and show in the address bar.
  url: { type: String, default: "" },
  // Optional label shown in the address bar instead of the raw URL.
  label: { type: String, default: "" },
  // iframe height (any CSS length; a bare number is treated as px).
  height: { type: [String, Number], default: 500 },
  // iframe title (accessibility).
  title: { type: String, default: "framejs preview" },
});

const bodyHeight =
  typeof props.height === "number" ? `${props.height}px` : props.height;
</script>

<template>
  <div class="browser-frame">
    <div class="browser-frame__chrome">
      <div class="browser-frame__dots" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <a
        v-if="url"
        class="browser-frame__address"
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ label || url }}
      </a>
      <div v-else class="browser-frame__address browser-frame__address--static">
        {{ label }}
      </div>
    </div>
    <div class="browser-frame__body" :style="{ height: bodyHeight }">
      <slot>
        <iframe
          v-if="url"
          :src="url"
          :title="title"
          width="100%"
          height="100%"
          frameborder="0"
          allow="clipboard-read; clipboard-write"
        ></iframe>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.browser-frame {
  border: 1px solid var(--line-strong, var(--vp-c-border));
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface, var(--vp-c-bg));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin: 20px 0;
}

.browser-frame__chrome {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--surface-2, var(--vp-c-bg-soft));
  border-bottom: 1px solid var(--line, var(--vp-c-border));
}

.browser-frame__dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.browser-frame__dots span {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--line-strong, #c4c0b6);
}

.browser-frame__dots span:nth-child(1) {
  background: #ff5f57;
}
.browser-frame__dots span:nth-child(2) {
  background: #febc2e;
}
.browser-frame__dots span:nth-child(3) {
  background: #28c840;
}

.browser-frame__address {
  flex: 1;
  min-width: 0;
  padding: 3px 10px;
  border-radius: var(--radius-control, 4px);
  background: var(--surface, var(--vp-c-bg));
  border: 1px solid var(--line, var(--vp-c-border));
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-2, var(--vp-c-text-2));
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s, border-color 0.15s;
}

a.browser-frame__address:hover {
  color: var(--accent, var(--vp-c-brand-1));
  border-color: var(--accent, var(--vp-c-brand-1));
}

.browser-frame__body {
  width: 100%;
  background: var(--vp-c-bg);
}

.browser-frame__body :deep(iframe) {
  display: block;
  border: 0;
}
</style>
