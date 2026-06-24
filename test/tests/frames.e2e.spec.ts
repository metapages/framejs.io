import { type Page, expect, request, test } from "@playwright/test";

// Browser-driven end-to-end coverage of the core flows: create a user (signup),
// log in with that user, and create / display / delete frames. Everything goes
// through the real UI; the only direct-API use is admin cleanup at the end.

const ADMIN_GRAPHQL_URL = process.env.NHOST_GRAPHQL_URL ??
  "https://local.hasura.local.nhost.run/v1/graphql";
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET ?? "nhost-admin-secret";

async function adminGraphql<T = Record<string, unknown>>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const ctx = await request.newContext({ ignoreHTTPSErrors: true });
  try {
    const res = await ctx.post(ADMIN_GRAPHQL_URL, {
      headers: { "x-hasura-admin-secret": ADMIN_SECRET },
      data: { query, variables },
    });
    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    return json.data as T;
  } finally {
    await ctx.dispose();
  }
}

// Frames (and their versions) RESTRICT-reference the user, so hard-delete in
// order: versions -> frames -> user.
async function purgeUser(email: string): Promise<void> {
  const { users } = await adminGraphql<{ users: { id: string }[] }>(
    `query($e: citext!) { users(where: { email: { _eq: $e } }) { id } }`,
    { e: email },
  );
  const id = users?.[0]?.id;
  if (!id) return;
  await adminGraphql(
    `mutation($id: uuid!) {
      delete_frame_version(where: { frames: { user: { _eq: $id } } }) { affected_rows }
      delete_frame(where: { user: { _eq: $id } }) { affected_rows }
      deleteUsers(where: { id: { _eq: $id } }) { affected_rows }
    }`,
    { id },
  );
}

test.describe.serial("user signup, login, and frame CRUD", () => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = "password123";
  const title = `E2E Frame ${Date.now()}`;
  const description = "Created by Playwright";
  const url = "https://framejs.io/#?js=Y29uc29sZS5sb2coMSk=";

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.context().close();
    await purgeUser(email);
  });

  test("signing up creates a user and lands on the dashboard", async () => {
    await page.goto("/signup");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: "Sign up" }).click();

    await page.waitForURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Your Frames" }))
      .toBeVisible();
    await expect(page.getByText("No frames yet")).toBeVisible();
  });

  test("creating a frame displays it with its og title and description", async () => {
    await page.getByRole("button", { name: "New Frame" }).click();
    await page.getByPlaceholder("My awesome frame").fill(title);
    await page.getByPlaceholder("What this frame does").fill(description);
    await page.getByPlaceholder("https://framejs.io/#?...").fill(url);
    await page.getByRole("button", { name: "Create" }).click();

    // Display uses the latest version's og { title, description }. The bookmark
    // links to the frame's detail view (/j/:uuid); the framejs.io url itself is
    // reachable from the copy button.
    const link = page.getByRole("link", { name: title });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /^\/j\//);
    await expect(page.getByText(description)).toBeVisible();
  });

  test("logging out and back in preserves the frame", async () => {
    await page.getByRole("button", { name: email }).click();
    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL((u) => new URL(u).pathname === "/");

    await page.goto("/login");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: "Log in" }).click();

    await page.waitForURL(/\/dashboard$/);
    await expect(page.getByRole("link", { name: title })).toBeVisible();
  });

  test("opening a frame shows the detail view with its controls", async () => {
    await page.getByRole("link", { name: title }).click();
    await page.waitForURL(/\/j\//);

    // The detail view chrome: back button, action row, the framejs.io url.
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await expect(
      page.getByText("framejs.io/#?js=", { exact: false }),
    ).toBeVisible();

    // The public read-only JSON API (dashless uuid) decodes the hash params.
    // The created url is "#?js=<base64 of console.log(1)>".
    const jsonRes = await page.request.get(`${page.url()}.json`);
    expect(jsonRes.ok()).toBeTruthy();
    expect(await jsonRes.json()).toMatchObject({ js: "console.log(1)" });

    // The public/private toggle flips the frame's visibility.
    await expect(page.getByRole("button", { name: "Public" })).toBeVisible();
    await page.getByRole("button", { name: "Public" }).click();
    await expect(page.getByRole("button", { name: "Private" })).toBeVisible();

    // Back to the dashboard for the delete flow below.
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: title })).toBeVisible();
  });

  test("deleting a frame is a soft delete and removes it from the list", async () => {
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByRole("link", { name: title })).toHaveCount(0);
    await expect(page.getByText("No frames yet")).toBeVisible();

    // Soft delete: the row still exists with deleted = true (hard-deletion is
    // a later, separate step).
    const { frame } = await adminGraphql<
      { frame: { id: string; deleted: boolean }[] }
    >(
      `query($e: citext!) {
        frame(where: { users: { email: { _eq: $e } } }) { id deleted }
      }`,
      { e: email },
    );
    expect(frame).toHaveLength(1);
    expect(frame[0].deleted).toBe(true);
  });
});
