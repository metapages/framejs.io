import { describe, expect, it, vi } from "vitest";

import {
  fetchFrameSource,
  isJsSourceUrl,
  RESERVED_SOURCE_INPUT,
  withoutReservedInputs,
} from "/@/utils/frameSource";
import { stripDisallowedHashParamsFromHashString } from "/@/utils/hashParams";
import { stringToBase64String } from "@metapages/hash-query";

// A frame's `js` has two legal forms: inline source, or a single-line http(s)
// URL referencing source (framejs.app hoists a large frame's source into
// storage and stores the reference). The editor has to cope with both.
//
// Why this matters here rather than only in the runtime: the editor's url used
// to carry the expanded SOURCE, which is what stopped the editor opening on a
// large frame — 1.65 MB of code becomes a 3.9 MB iframe `src`, past Chrome's
// 2 MiB navigation cap (the pane lands on `about:blank#blocked`, empty, with no
// console error) and past Firefox's 1 MiB url-parser limit. The source now
// travels over postMessage and the url keeps the reference.

describe("isJsSourceUrl", () => {
  it("treats a single-line http(s) url as a reference", () => {
    expect(isJsSourceUrl("https://framejs.app/f/abc")).toBe(true);
    expect(isJsSourceUrl("http://localhost:8799/f/abc")).toBe(true);
    // Surrounding whitespace is how a hoisted value actually arrives sometimes.
    expect(isJsSourceUrl("  https://framejs.app/f/abc \n")).toBe(true);
  });

  it("treats real source as source, however url-ish it looks", () => {
    // The dangerous direction: misreading CODE as a reference would make the
    // editor fetch a url instead of showing the frame's code.
    expect(isJsSourceUrl('const u = "https://framejs.app/f/abc";')).toBe(false);
    expect(isJsSourceUrl("// https://framejs.app/f/abc\nconsole.log(1)")).toBe(
      false,
    );
    expect(isJsSourceUrl("https://a.example/x https://b.example/y")).toBe(
      false,
    );
    expect(isJsSourceUrl("console.log(1)")).toBe(false);
  });

  it("is false for nothing at all", () => {
    expect(isJsSourceUrl(undefined)).toBe(false);
    expect(isJsSourceUrl("")).toBe(false);
  });

  it("rejects a non-http scheme", () => {
    // `js` is fetched, so only http(s) may be followed.
    expect(isJsSourceUrl("file:///etc/passwd")).toBe(false);
    expect(isJsSourceUrl("javascript:alert(1)")).toBe(false);
    expect(isJsSourceUrl("data:text/plain,hi")).toBe(false);
  });
});

describe("withoutReservedInputs", () => {
  it("strips the reserved source so it cannot leak into a shared url", () => {
    // The runtime sends the source in the SAME input map as the frame's own
    // inputs (metapage has no separate parent->child payload channel), and
    // ButtonCopyExternalLink folds that map into the `inputs` hash param of a
    // shared url. Unfiltered, the whole source would ride along as if the user
    // had set it as an input.
    const inputs = {
      a: 1,
      b: "two",
      [RESERVED_SOURCE_INPUT]: "console.log('the entire frame source')",
    };
    expect(withoutReservedInputs(inputs)).toEqual({ a: 1, b: "two" });
  });

  it("leaves the frame's own inputs untouched", () => {
    const inputs = { a: 1 };
    // Same object back when there is nothing to strip — no needless re-render.
    expect(withoutReservedInputs(inputs)).toBe(inputs);
    expect(withoutReservedInputs(undefined)).toBeUndefined();
  });

  it("does not mutate its argument", () => {
    const inputs = { a: 1, [RESERVED_SOURCE_INPUT]: "src" };
    withoutReservedInputs(inputs);
    expect(RESERVED_SOURCE_INPUT in inputs).toBe(true);
  });
});

describe("fetchFrameSource", () => {
  it("returns the source and caches it per url", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: () => Promise.resolve("console.log('fetched')"),
    });
    vi.stubGlobal("fetch", fetchMock);

    const url = `https://framejs.app/f/${crypto.randomUUID()}`;
    expect(await fetchFrameSource(url)).toBe("console.log('fetched')");
    // Content behind a reference is immutable (content-addressed), so a second
    // read must not go back to the network.
    expect(await fetchFrameSource(url)).toBe("console.log('fetched')");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it("returns undefined on failure rather than an error string", async () => {
    // Load-bearing: the caller writes what it gets back into the frame's `js`.
    // Returning an error message would save that message AS the frame's source
    // on the next write, destroying the frame.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502, statusText: "Bad" }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(
      await fetchFrameSource(`https://framejs.app/f/${crypto.randomUUID()}`),
    ).toBeUndefined();

    errorSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("returns undefined when the network throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(
      await fetchFrameSource(`https://framejs.app/f/${crypto.randomUUID()}`),
    ).toBeUndefined();

    errorSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// stripDisallowedHashParamsFromHashString
//
// The save and shorten buttons now INJECT the source into the hash they
// serialize (it lives in the store, not the url), and then strip params the
// frame's definition does not whitelist. That strip used to go through
// `new URL()`, which Firefox's parser throws on past 1 MiB — a frame's source
// comfortably exceeds that. This variant never builds a url.
// ---------------------------------------------------------------------------

describe("stripDisallowedHashParamsFromHashString", () => {
  const allowed = new Set(["js", "og"]);

  it("keeps allowed params and drops the rest", () => {
    const out = stripDisallowedHashParamsFromHashString(
      "?js=YQ==&og=Yg==&edit=true&hm=disabled",
      allowed,
    );
    expect(out).toContain("js=YQ==");
    expect(out).toContain("og=Yg==");
    expect(out).not.toContain("edit=");
    expect(out).not.toContain("hm=");
  });

  it("preserves a multi-megabyte js value untouched", () => {
    // The whole point. 1.6 MB of source encodes to ~4 MB — past Firefox's
    // 1 MiB url cap, so this must not round-trip through a URL.
    const big = stringToBase64String("x".repeat(1_600_000));
    expect(big.length).toBeGreaterThan(1024 * 1024);

    const out = stripDisallowedHashParamsFromHashString(
      `?js=${big}&edit=true`,
      allowed,
    );
    expect(out).toContain(`js=${big}`);
    expect(out).not.toContain("edit=");
  });

  it("is a no-op on an empty hash", () => {
    expect(stripDisallowedHashParamsFromHashString("", allowed)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// The wipe
//
// A 1.6 MB frame was edited, the editor closed, and reopening it SAVED A
// VERSION WITH NO CODE. Mechanism: the source travels over postMessage, so it
// is briefly unknown; PanelCode mounted the editor with `code ?? ""` in that
// window; the inner Monaco metaframe runs with `autosend: true` and so emitted
// its empty buffer straight back as an output; the runtime committed that as an
// edit. The bigger the frame, the more reliably the race is lost.
//
// Two defences, and these cases pin the shapes both rely on. The seeding
// contract is what PanelCode keys off, so it has to be exact: `undefined` means
// NOT YET KNOWN (wait), `""` means a genuinely empty frame (mount).
// ---------------------------------------------------------------------------

describe("the source-known contract", () => {
  it("distinguishes not-yet-known from genuinely empty", () => {
    // PanelCode must be able to tell these apart; `!code` cannot.
    const notKnown: string | undefined = undefined;
    const emptyFrame: string | undefined = "";
    expect(notKnown === undefined).toBe(true);
    expect(emptyFrame === undefined).toBe(false);
    // The old test — and the old render condition — collapsed them.
    expect(!notKnown).toBe(true);
    expect(!emptyFrame).toBe(true);
  });

  it("an empty string is a legitimate source, not a missing one", () => {
    // So the seed must accept "" (an empty frame mounts) while never inventing
    // it when a runtime is present and simply has not answered yet.
    expect(typeof "" === "string").toBe(true);
    expect(isJsSourceUrl("")).toBe(false);
  });
});

describe("the runtime's refuse-to-wipe guard", () => {
  // Mirrors the condition in worker/index.html's onOutput handler. Kept here
  // because the runtime is an inline module with no test harness of its own,
  // and this is the predicate that stands between a race and a destroyed frame.
  const wouldWipe = (source: string, seeded: string | null) =>
    !source.trim() && !!seeded && !!seeded.trim();

  it("refuses an empty output when real source was seeded", () => {
    expect(wouldWipe("", "console.log(1)")).toBe(true);
    expect(wouldWipe("   \n ", "console.log(1)")).toBe(true);
  });

  it("allows an empty output when the frame was already empty", () => {
    expect(wouldWipe("", "")).toBe(false);
    expect(wouldWipe("", null)).toBe(false);
  });

  it("never blocks a real edit", () => {
    expect(wouldWipe("console.log(2)", "console.log(1)")).toBe(false);
    // Down to a single character is still a real edit.
    expect(wouldWipe("x", "console.log(1)")).toBe(false);
  });
});
