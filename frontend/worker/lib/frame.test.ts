import { assertEquals } from "jsr:@std/assert@^1";
import {
  embedFrameUrl,
  frameIdFromSlug,
  frameSlug,
  normalizeFrameUrl,
  ogFromFrameUrl,
  unpackFrameUrl,
  unpackHashParamValue,
} from "@/lib/frame.ts";

// Encode a value the way @metapages/hash-query does: base64(encodeURIComponent).
function encode(payload: string): string {
  return btoa(encodeURIComponent(payload));
}

Deno.test("unpackHashParamValue decodes a JSON blob to an object", () => {
  const og = { title: "Hello", description: "World" };
  assertEquals(
    unpackHashParamValue(encode(JSON.stringify(og))),
    og,
  );
});

Deno.test("unpackHashParamValue decodes a base64 string payload to its raw string", () => {
  const js = "export function onInputs(inputs) { return inputs; }";
  assertEquals(unpackHashParamValue(encode(js)), js);
});

Deno.test("unpackHashParamValue leaves a non-encoded scalar as a plain value", () => {
  // "visible" is not valid base64 length -> plain path.
  assertEquals(unpackHashParamValue("visible"), "visible");
  // "true" is coincidentally valid base64 but decodes to binary -> plain path.
  assertEquals(unpackHashParamValue("true"), "true");
});

Deno.test("unpackFrameUrl expands every hash param, preserving base64 '+'", () => {
  const og = encode(JSON.stringify({ title: "T" }));
  const js = encode("a > b && c < d"); // produces a '+' in base64
  const url = `https://framejs.io/#?js=${js}&og=${og}&hm=visible`;
  assertEquals(unpackFrameUrl(url), {
    js: "a > b && c < d",
    og: { title: "T" },
    hm: "visible",
  });
});

Deno.test("unpackFrameUrl on an empty/paramless url yields an empty dict", () => {
  assertEquals(unpackFrameUrl("https://framejs.io/"), {});
  assertEquals(unpackFrameUrl(undefined), {});
});

Deno.test("frameSlug <-> frameIdFromSlug round-trips a uuid", () => {
  const id = "019eec76-c608-722e-9293-ca8baaf74a76";
  assertEquals(frameSlug(id), "019eec76c608722e9293ca8baaf74a76");
  assertEquals(frameIdFromSlug(frameSlug(id)), id);
  // Already-dashed or non-32-char input is returned unchanged.
  assertEquals(frameIdFromSlug(id), id);
});

Deno.test("ogFromFrameUrl decodes the base64 og hash param", () => {
  const og = { title: "Hello", description: "A & B <c>" };
  const url = `https://framejs.io/#?js=${encode("x")}&og=${
    encode(JSON.stringify(og))
  }`;
  assertEquals(ogFromFrameUrl(url), og);
  assertEquals(ogFromFrameUrl("https://framejs.io/#?js=AAA"), undefined);
});

Deno.test("normalizeFrameUrl strips transient params and sorts the rest", () => {
  const url = "https://framejs.io/#?og=AAA&js=BBB&hm=visible&edit=true&css=CCC";
  assertEquals(normalizeFrameUrl(url), "https://framejs.io/#?js=BBB&og=AAA");
});

Deno.test("embedFrameUrl appends an always-visible menu flag", () => {
  assertEquals(
    embedFrameUrl("https://framejs.io/#?js=BBB"),
    "https://framejs.io/#?js=BBB&hm=visible",
  );
  assertEquals(embedFrameUrl(""), "https://framejs.io/#?hm=visible");
});
