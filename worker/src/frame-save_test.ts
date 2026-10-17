import { assertEquals } from "@std/assert";
import { parseSaveFrameBody } from "./frame-save.ts";

const decode = (hashParams: string) => ({ js: `decoded:${hashParams}` });

Deno.test("parseSaveFrameBody forwards a plain JSON frame as-is", () => {
  const frame = {
    js: "root.innerHTML = 'hi'",
    inputs: { "data.json": { a: 1 } },
    og: { title: "Exported" },
  };
  assertEquals(parseSaveFrameBody({ frame }, decode), {
    frameJson: frame,
    id: undefined,
  });
});

Deno.test("parseSaveFrameBody passes an existing id through", () => {
  const result = parseSaveFrameBody(
    { frame: { js: "x" }, id: "019f2916dcb17ace8876580ebd1fdcd5" },
    decode,
  );
  assertEquals(result, {
    frameJson: { js: "x" },
    id: "019f2916dcb17ace8876580ebd1fdcd5",
  });
});

Deno.test("parseSaveFrameBody still decodes the editor's hashParams", () => {
  assertEquals(parseSaveFrameBody({ hashParams: "?js=abc" }, decode), {
    frameJson: { js: "decoded:?js=abc" },
    id: undefined,
  });
});

Deno.test("parseSaveFrameBody prefers frame over hashParams", () => {
  const result = parseSaveFrameBody(
    { frame: { js: "plain" }, hashParams: "?js=abc" },
    decode,
  );
  assertEquals(result, { frameJson: { js: "plain" }, id: undefined });
});

Deno.test("parseSaveFrameBody rejects bodies with nothing to save", () => {
  for (
    const body of [
      null,
      {},
      { hashParams: "" },
      { frame: null },
      { frame: [] },
      { frame: "js" },
      { frame: {} },
      { frame: { js: "" } },
      { frame: { js: 42 } },
    ]
  ) {
    const result = parseSaveFrameBody(body as never, decode);
    assertEquals("error" in result, true, JSON.stringify(body));
  }
});
