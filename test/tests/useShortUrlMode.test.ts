import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useShortUrlMode } from "/@/hooks/useShortUrlMode";

// JSDOM doesn't allow direct assignment to window.location, so we replace it
// with a plain object that allows mutation and records navigations.
//
// `href` is DERIVED from `hash`, as it is in a real browser: the hook reads the
// hash params through @metapages/hash-query, which parses `location.href`, so a
// stand-in whose `href` stayed frozen at its initial value would report `edit`
// as absent no matter what the test set `hash` to — and every assertion of the
// form "no navigation happened" would pass for the wrong reason.
//
// Assigning `href` is how the hook navigates, so that is recorded rather than
// applied: `navigations` is the assertion surface, not `href`.
const setupLocation = (hash: string) => {
  const navigations: string[] = [];
  const loc = {
    hash,
    origin: "http://localhost",
    get href() {
      return `http://localhost/${loc.hash}`;
    },
    set href(value: string) {
      navigations.push(value);
    },
  };
  Object.defineProperty(window, "location", { writable: true, value: loc });
  return { loc, navigations };
};

describe("useShortUrlMode", () => {
  beforeEach(() => {
    delete window.__SHORT_URL_ID;
  });

  afterEach(() => {
    // Unmount, so the hook's `hashchange` listener is removed. Vitest is not
    // running with globals, so testing-library does not auto-clean up — and a
    // listener left behind by an earlier test reacts to this test's hashchange
    // too, navigating once per leaked mount.
    cleanup();
    delete window.__SHORT_URL_ID;
  });

  it("does nothing when __SHORT_URL_ID is not set", () => {
    const { loc, navigations } = setupLocation("#?js=abc123");
    renderHook(() => useShortUrlMode());

    loc.hash = "#?js=abc123&edit=true";
    window.dispatchEvent(
      new HashChangeEvent("hashchange", {
        oldURL: "http://localhost/#?js=abc123",
        newURL: "http://localhost/#?js=abc123&edit=true",
      }),
    );

    expect(navigations).toEqual([]);
  });

  it("does not navigate when in short URL mode with no edit param", () => {
    window.__SHORT_URL_ID = "abc123def456";
    const { loc, navigations } = setupLocation("#?js=abc123");
    renderHook(() => useShortUrlMode());

    loc.hash = "#?js=abc123&modules=%5B%5D";
    window.dispatchEvent(
      new HashChangeEvent("hashchange", {
        oldURL: "http://localhost/#?js=abc123",
        newURL: "http://localhost/#?js=abc123&modules=%5B%5D",
      }),
    );

    // No edit=true, so no navigation
    expect(navigations).toEqual([]);
  });

  it("does not navigate when only the edit param is added", () => {
    window.__SHORT_URL_ID = "abc123def456";
    const { loc, navigations } = setupLocation("#?js=abc123");
    renderHook(() => useShortUrlMode());

    // Hash changes only by adding edit=true
    loc.hash = "#?js=abc123&edit=true";
    window.dispatchEvent(
      new HashChangeEvent("hashchange", {
        oldURL: "http://localhost/#?js=abc123",
        newURL: "http://localhost/#?js=abc123&edit=true",
      }),
    );

    expect(navigations).toEqual([]);
  });

  it("navigates to root when edit=true and content hash changed", () => {
    window.__SHORT_URL_ID = "abc123def456";
    const { loc, navigations } = setupLocation("#?js=abc123");
    renderHook(() => useShortUrlMode());

    // Content changed: js param is different
    loc.hash = "#?js=xyz789&edit=true";
    window.dispatchEvent(
      new HashChangeEvent("hashchange", {
        oldURL: "http://localhost/#?js=abc123",
        newURL: "http://localhost/#?js=xyz789&edit=true",
      }),
    );

    expect(navigations).toEqual(["http://localhost/#?js=xyz789&edit=true"]);
  });

  it("navigates immediately when edit=true is already on the URL at mount", () => {
    window.__SHORT_URL_ID = "abc123def456";
    const { navigations } = setupLocation("#?js=abc123&edit=true");
    renderHook(() => useShortUrlMode());

    expect(navigations).toEqual(["http://localhost/#?js=abc123&edit=true"]);
  });
});
