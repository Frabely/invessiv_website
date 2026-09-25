import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { createClerkClient } from "@clerk/backend";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { type Browser, expect, test } from "@playwright/test";
import { preparePortalE2eDatabase } from "./support/portal-e2e-database";
import { portalE2ePaths } from "./support/portal-e2e-fixture";

const TEST_USERS = [
  {
    email: "invessiv-portal-manager+clerk_test@example.com",
    firstName: "Portal",
    lastName: "E2E Manager",
    state: portalE2ePaths.managerState,
  },
  {
    email: "invessiv-portal-a+clerk_test@example.com",
    firstName: "Portal",
    lastName: "E2E Contact A",
    state: portalE2ePaths.contactAState,
  },
  {
    email: "invessiv-portal-b+clerk_test@example.com",
    firstName: "Portal",
    lastName: "E2E Contact B",
    state: portalE2ePaths.contactBState,
  },
] as const;

async function ensureTestUsers() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey?.startsWith("sk_test_"))
    throw new Error("Clerk development secret key is required.");
  const client = createClerkClient({ secretKey });
  const ids = new Map<string, string>();
  for (const user of TEST_USERS) {
    const existing = await client.users.getUserList({
      emailAddress: [user.email],
    });
    if (existing.totalCount > 1)
      throw new Error(`More than one Clerk test user has ${user.email}.`);
    const resolved =
      existing.data[0] ??
      (await client.users.createUser({
        emailAddress: [user.email],
        firstName: user.firstName,
        lastName: user.lastName,
        password: randomBytes(32).toString("base64url"),
      }));
    ids.set(user.email, resolved.id);
  }
  return ids;
}

async function saveAuthenticatedState(
  browser: Browser,
  email: string,
  path: string,
) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto("http://localhost:4174/de/sign-in");
    await clerk.signIn({ page, emailAddress: email });
    await context.storageState({ path });
  } finally {
    await context.close();
  }
}

test.describe.configure({ mode: "serial" });

test("prepares development Clerk users, database rows and authenticated sessions", async ({
  browser,
}) => {
  await clerkSetup();
  const users = await ensureTestUsers();
  const managerId = users.get(TEST_USERS[0].email);
  expect(managerId).toBeTruthy();
  const fixture = await preparePortalE2eDatabase(managerId!);
  await mkdir(portalE2ePaths.directory, { recursive: true });
  await writeFile(portalE2ePaths.fixture, JSON.stringify(fixture), "utf8");
  for (const user of TEST_USERS) {
    await saveAuthenticatedState(browser, user.email, user.state);
  }
});
