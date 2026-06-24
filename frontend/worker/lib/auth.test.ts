import { assertEquals } from "jsr:@std/assert@^1";
import { getUserFromRequest } from "@/lib/auth.ts";

function reqWithCookie(cookie: string): Request {
  return new Request("https://framejs.localhost/dashboard", {
    headers: { cookie },
  });
}

const goodSession = encodeURIComponent(JSON.stringify({
  accessToken: "tok",
  user: { id: "u1", email: "a@b.c" },
}));

Deno.test("getUserFromRequest reads a single valid session cookie", () => {
  const got = getUserFromRequest(reqWithCookie(`nhostSession=${goodSession}`));
  assertEquals(got?.user.id, "u1");
  assertEquals(got?.accessToken, "tok");
});

Deno.test("getUserFromRequest skips a malformed leading duplicate", () => {
  // A stale/sibling duplicate ordered FIRST must not shadow the good one.
  const cookie = `nhostSession=%7Bbroken; nhostSession=${goodSession}`;
  assertEquals(getUserFromRequest(reqWithCookie(cookie))?.user.id, "u1");
});

Deno.test("getUserFromRequest skips a session missing accessToken", () => {
  const noToken = encodeURIComponent(JSON.stringify({ user: { id: "u2" } }));
  const cookie = `nhostSession=${noToken}; nhostSession=${goodSession}`;
  assertEquals(getUserFromRequest(reqWithCookie(cookie))?.user.id, "u1");
});

Deno.test("getUserFromRequest returns null with no session cookie", () => {
  assertEquals(getUserFromRequest(reqWithCookie("other=1")), null);
  assertEquals(getUserFromRequest(reqWithCookie("")), null);
});
