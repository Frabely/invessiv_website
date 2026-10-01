import { expect, test } from "@playwright/test";

const emptyStorageState = { cookies: [], origins: [] };
const writerState =
  process.env.E2E_ONBOARDING_WRITER_STORAGE_STATE ?? emptyStorageState;
const customerId = process.env.E2E_ONBOARDING_CUSTOMER_ID;
const projectTitle = process.env.E2E_ONBOARDING_PROJECT_TITLE;

test.describe("onboarding writer", () => {
  test.use({ storageState: writerState });

  test.beforeEach(() => {
    test.skip(
      typeof writerState !== "string" || !customerId || !projectTitle,
      "Configure the onboarding-writer Clerk session and fixture values.",
    );
  });

  // A project has exactly one form and no way to delete it, so the test starts the form on its
  // first run and reuses it afterwards. The block it adds is removed again at the end.
  test("starts or opens the form of a project and adjusts its structure", async ({
    page,
  }) => {
    const blockTitle = `E2E Baustein ${Date.now()}`;

    const response = await page.goto(`/de/crm?cockpit=${customerId}`);
    expect(response?.status()).toBe(200);
    await page.getByRole("tab", { name: projectTitle, exact: true }).click();

    const start = page.getByRole("button", { name: "Onboarding starten" });
    const open = page.getByRole("link", { name: "Bogen öffnen" });
    await expect(start.or(open)).toBeVisible();
    if (await start.isVisible()) {
      await start.click();
      const dialog = page.getByRole("dialog", { name: "Onboarding starten" });
      await dialog.getByRole("button", { name: "Entwurf anlegen" }).click();
    } else {
      await open.click();
    }

    await expect(page).toHaveURL(/\/de\/crm\/onboarding\/[0-9a-f-]{36}/);
    await expect(
      page.getByRole("tab", { name: "Aufbau", selected: true }),
    ).toBeVisible();
    // There is no release action before the portal form is complete.
    await expect(page.getByRole("button", { name: /freigeben/i })).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: "Eigener Baustein" }).click();
    const ownDialog = page.getByRole("dialog", { name: "Eigener Baustein" });
    await ownDialog.getByRole("textbox", { name: /Titel/ }).fill(blockTitle);
    await ownDialog.getByRole("button", { name: "Baustein anlegen" }).click();

    await expect(page).toHaveURL(/[?&]block=[0-9a-f-]{36}/);
    await expect(
      page.getByRole("listitem").filter({ hasText: blockTitle }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Feld hinzufügen" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: `„${blockTitle}“ entfernen` })
      .click();
    await page
      .getByRole("dialog", { name: "Baustein entfernen?" })
      .getByRole("button", { name: "Entfernen" })
      .click();

    await expect(
      page.getByRole("listitem").filter({ hasText: blockTitle }),
    ).toHaveCount(0);
    await expect(page).not.toHaveURL(/[?&]block=/);
  });
});
