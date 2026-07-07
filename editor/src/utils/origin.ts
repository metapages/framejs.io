// This is not much use for a single static site, but becomes more relevant
// when part of a server

let origin = window.location.origin;
if (import.meta.env.DEV) {
  origin = `https://${import.meta.env.VITE_APP_FQDN || "metaframe1.dev"}${
    import.meta.env.VITE_APP_PORT ? ":" + import.meta.env.VITE_APP_PORT : ""
  }`;
}

export const APP_ORIGIN = origin;

declare global {
  interface Window {
    __FRAMEJS_APP_ORIGIN?: string;
  }
}

// Origin of the framejs.app account/home app. The worker injects the configured
// origin as window.__FRAMEJS_APP_ORIGIN (dev override vs prod default); when the
// editor is embedded as an iframe it lives on the parent frame instead.
export const getFramejsAppOrigin = (): string => {
  try {
    if (window.parent !== window && window.parent.__FRAMEJS_APP_ORIGIN) {
      return window.parent.__FRAMEJS_APP_ORIGIN;
    }
  } catch {
    // cross-origin parent
  }
  return window.__FRAMEJS_APP_ORIGIN || "https://framejs.app";
};
