import { assertEquals } from "@std/assert";
import { parseSaveFrameBody, saveFrame } from "./frame-save.ts";

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

Deno.test("parseSaveFrameBody rejects an id that is not a uuid", () => {
  for (
    const id of [
      "abc",
      "019f2916dcb17ace",
      42,
      "x019f2916dcb17ace8876580ebd1fdcd5",
    ]
  ) {
    const result = parseSaveFrameBody(
      { frame: { js: "x" }, id } as never,
      decode,
    );
    assertEquals("error" in result, true, JSON.stringify(id));
  }
});

Deno.test("parseSaveFrameBody treats an empty or null id as a new frame", () => {
  for (const id of [undefined, null, ""]) {
    assertEquals(parseSaveFrameBody({ frame: { js: "x" }, id }, decode), {
      frameJson: { js: "x" },
      id: undefined,
    });
  }
});

Deno.test("parseSaveFrameBody strips default-valued params but keeps unknown keys", () => {
  assertEquals(
    parseSaveFrameBody(
      { frame: { js: "x", editorWidth: "80ch", camera: { zoom: 2 } } },
      decode,
    ),
    { frameJson: { js: "x", camera: { zoom: 2 } }, id: undefined },
  );
});

// Integration: saveFrame against a stub framejs.app over real HTTP, so the
// forwarded request (path, method, body) is what framejs.app would receive.
async function withStubFramejsApp(
  respond: (req: Request) => Response,
  run: (
    origin: string,
    received: { path: string; method: string; body: unknown }[],
  ) => Promise<void>,
) {
  const received: { path: string; method: string; body: unknown }[] = [];
  const server = Deno.serve(
    { port: 0, hostname: "127.0.0.1", onListen: () => {} },
    async (req) => {
      received.push({
        path: new URL(req.url).pathname,
        method: req.method,
        body: await req.json(),
      });
      return respond(req);
    },
  );
  try {
    await run(`http://127.0.0.1:${server.addr.port}`, received);
  } finally {
    await server.shutdown();
  }
}

const ok = () => Response.json({ ok: true });

Deno.test("saveFrame forwards a new frame to framejs.app and returns its url", async () => {
  await withStubFramejsApp(ok, async (origin, received) => {
    const frame = { js: "root.innerHTML = 'hi'", og: { title: "t" } };
    const result = await saveFrame({ frame }, {
      appOrigin: origin,
      decodeHashParams: decode,
    });

    assertEquals(result.status, 200);
    const { id, url } = result.body as { id: string; url: string };
    assertEquals(/^[0-9a-f]{32}$/.test(id), true, id);
    assertEquals(url, `${origin}/j/${id}`);
    assertEquals(received, [{
      path: `/j/${id}.json`,
      method: "POST",
      body: frame,
    }]);
  });
});

Deno.test("saveFrame updates the given frame in place (dashed id normalized)", async () => {
  await withStubFramejsApp(ok, async (origin, received) => {
    const result = await saveFrame(
      { frame: { js: "v2" }, id: "019f2916-dcb1-7ace-8876-580ebd1fdcd5" },
      { appOrigin: origin, decodeHashParams: decode },
    );
    const id = "019f2916dcb17ace8876580ebd1fdcd5";
    assertEquals(result, {
      status: 200,
      body: { id, url: `${origin}/j/${id}` },
    });
    assertEquals(received[0].path, `/j/${id}.json`);
    assertEquals(received[0].body, { js: "v2" });
  });
});

Deno.test("saveFrame forwards the editor's decoded hashParams", async () => {
  await withStubFramejsApp(ok, async (origin, received) => {
    const result = await saveFrame(
      { hashParams: "?js=abc" },
      { appOrigin: origin, decodeHashParams: decode },
    );
    assertEquals(result.status, 200);
    assertEquals(received[0].body, { js: "decoded:?js=abc" });
  });
});

Deno.test("saveFrame maps upstream 403 to 403 and other failures to 502", async () => {
  const cases: [number, 403 | 502][] = [[403, 403], [500, 502], [404, 502]];
  for (const [upstream, expected] of cases) {
    await withStubFramejsApp(
      () => new Response("nope", { status: upstream }),
      async (origin) => {
        const result = await saveFrame(
          { frame: { js: "x" } },
          { appOrigin: origin, decodeHashParams: decode },
        );
        assertEquals(result, {
          status: expected,
          body: { error: "Failed to save frame", status: upstream },
        });
      },
    );
  }
});

Deno.test("saveFrame sends nothing upstream for an invalid request", async () => {
  await withStubFramejsApp(ok, async (origin, received) => {
    const result = await saveFrame(
      { frame: { js: "x" }, id: "not-a-uuid" },
      { appOrigin: origin, decodeHashParams: decode },
    );
    assertEquals(result.status, 400);
    assertEquals(received.length, 0);
  });
});
