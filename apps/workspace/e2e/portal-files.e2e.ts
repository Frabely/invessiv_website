import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  type PortalE2eFixture,
  portalE2ePaths,
} from "./support/portal-e2e-fixture";

let fixture: PortalE2eFixture;

/**
 * Links keep this suite independent of a real blob store: releasing works the same for links and
 * uploads, and no test contacts a storage provider.
 */
test.describe.serial("portal files", () => {
  test.use({ storageState: portalE2ePaths.managerState });

  test.beforeAll(async () => {
    fixture = JSON.parse(
      await readFile(portalE2ePaths.fixture, "utf8"),
    ) as PortalE2eFixture;
  });

  test("shares released links, hides the actual internal id, and receives a customer link", async ({
    page,
    browser,
  }, testInfo) => {
    const suffix = Date.now().toString(36);
    const released = `Freigegeben ${suffix}`;
    const internal = `Intern ${suffix}`;

    await page.goto(`/de/crm?cockpit=${fixture.filesCustomer}`);
    let internalId = "";
    for (const [name, visible] of [
      [released, true],
      [internal, false],
    ] as const) {
      await page.getByRole("button", { name: "Link hinzufügen" }).click();
      const dialog = page.getByRole("dialog", { name: "Link hinzufügen" });
      await dialog.getByLabel("Bezeichnung").fill(name);
      await dialog
        .getByRole("textbox", { name: /^Link/ })
        .fill(`https://example.com/${encodeURIComponent(name)}`);
      if (visible) await dialog.getByLabel("Für den Kunden sichtbar").check();
      const saved = page.waitForResponse(
        (response) =>
          response
            .url()
            .endsWith(
              `/api/workspace/crm/customers/${fixture.filesCustomer}/files/links`,
            ) && response.request().method() === "POST",
      );
      await dialog.getByRole("button", { name: "Link speichern" }).click();
      const response = await saved;
      expect(response.ok()).toBe(true);
      const payload = (await response.json()) as { id: string };
      if (!visible) internalId = payload.id;
      await expect(dialog).toBeHidden();
    }
    expect(internalId).toBeTruthy();

    await page.goto(`/de/portal/${fixture.filesCustomer}/files`);
    await expect(page.getByRole("heading", { name: "Dateien" })).toBeVisible();
    const list = page.getByRole("list", { name: "Dateien und Links" });
    await expect(
      list.getByRole("link", { name: new RegExp(released) }).first(),
    ).toBeVisible();
    await expect(list.getByText(internal)).toHaveCount(0);
    // The owner view reads but never uploads.
    await expect(
      page.getByText("Dateien auswählen oder hierher ziehen"),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Im CRM hochladen" }),
    ).toBeVisible();

    const hiddenOwner = await page.request.get(
      `/api/portal/${fixture.filesCustomer}/files/${internalId}/download-url`,
    );
    expect(hiddenOwner.status()).toBe(404);
    expect(hiddenOwner.headers()["cache-control"]).toBe("private, no-store");

    const contactContext = await browser.newContext({
      storageState: portalE2ePaths.filesContactState,
    });
    try {
      const contact = await contactContext.newPage();
      await contact.goto(`/de/portal/${fixture.filesCustomer}/files`);
      await expect(
        contact.getByRole("link", { name: new RegExp(released) }).first(),
      ).toBeVisible();
      await expect(contact.getByText(internal)).toHaveCount(0);
      const hiddenContact = await contact.request.get(
        `/api/portal/${fixture.filesCustomer}/files/${internalId}/download-url`,
      );
      expect(hiddenContact.status()).toBe(404);

      const customerLink = `Vom Kunden ${suffix}`;
      await contact.getByRole("button", { name: "Link hinzufügen" }).click();
      const contactDialog = contact.getByRole("dialog", {
        name: "Link hinzufügen",
      });
      await contactDialog.getByLabel("Bezeichnung").fill(customerLink);
      await contactDialog
        .getByRole("textbox", { name: /^Link/ })
        .fill(`https://example.com/${suffix}/customer`);
      await contactDialog
        .getByRole("button", { name: "Link speichern" })
        .click();
      await expect(contactDialog).toBeHidden();
      await expect(
        contact.getByRole("tab", { name: "Von dir" }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(
        contact.getByRole("link", { name: new RegExp(customerLink) }).first(),
      ).toBeVisible();

      const internalList = await page.request.get(
        `/api/workspace/crm/customers/${fixture.filesCustomer}/files?origin=customer`,
      );
      expect(internalList.ok()).toBe(true);
      const internalPage = (await internalList.json()) as {
        files: { displayName: string }[];
      };
      expect(internalPage.files.map((file) => file.displayName)).toContain(
        customerLink,
      );
    } finally {
      await contactContext.close();
    }

    for (const viewport of [
      { name: "desktop", width: 1280, height: 900 },
      { name: "mobile", width: 360, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow).toBe(false);
      await page.screenshot({
        path: testInfo.outputPath(`portal-files-${viewport.name}.png`),
        fullPage: true,
      });
    }

    await page.getByRole("tab", { name: "Von dir" }).click();
    await expect(page).toHaveURL(/tab=fromYou/);
  });
});
