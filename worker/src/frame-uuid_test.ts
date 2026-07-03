import { assert, assertEquals, assertMatch } from "@std/assert";
import {
  normalizeUuid,
  resolveSaveUuid,
  UUID_REGEX,
  uuidv7,
} from "./frame-uuid.ts";

const DASHLESS = /^[0-9a-f]{32}$/i;

Deno.test("normalizeUuid strips dashes", () => {
  assertEquals(
    normalizeUuid("019f2916-dcb1-7ace-8876-580ebd1fdcd5"),
    "019f2916dcb17ace8876580ebd1fdcd5",
  );
});

Deno.test("normalizeUuid is a no-op on an already-dashless id", () => {
  const dashless = "019f2916dcb17ace8876580ebd1fdcd5";
  assertEquals(normalizeUuid(dashless), dashless);
});

Deno.test("uuidv7 mints a dashed, UUID_REGEX-matching id", () => {
  const id = uuidv7();
  assertMatch(id, UUID_REGEX);
  assert(id.includes("-"));
});

Deno.test("resolveSaveUuid mints a fresh dashless uuid when no id is given", () => {
  const uuid = resolveSaveUuid(undefined);
  assertMatch(uuid, DASHLESS);
});

Deno.test("resolveSaveUuid strips dashes from a valid existing dashed id", () => {
  const uuid = resolveSaveUuid("019f2916-dcb1-7ace-8876-580ebd1fdcd5");
  assertEquals(uuid, "019f2916dcb17ace8876580ebd1fdcd5");
  assertMatch(uuid, DASHLESS);
});

Deno.test("resolveSaveUuid passes through an already-dashless existing id", () => {
  const dashless = "019f2916dcb17ace8876580ebd1fdcd5";
  assertEquals(resolveSaveUuid(dashless), dashless);
});

Deno.test("resolveSaveUuid mints a fresh uuid when the given id is invalid", () => {
  const uuid = resolveSaveUuid("not-a-uuid");
  assertMatch(uuid, DASHLESS);
});

// Regression test for the Save button bug: a newly-created frame's uuid must
// never carry dashes into the framejs.app URL handed back to the browser.
Deno.test("resolveSaveUuid output is safe to embed directly in a /j/:uuid url", () => {
  const uuid = resolveSaveUuid(undefined);
  const url = `https://framejs.app/j/${uuid}`;
  assertEquals(url.includes("-"), false);
});
