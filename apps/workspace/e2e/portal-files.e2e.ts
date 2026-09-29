import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";
import {
  type PortalE2eFixture,
  portalE2ePaths,
} from "./support/portal-e2e-fixture";

let fixture: PortalE2eFixture;

/** Link and chat coverage runs without storage; the opt-in upload case uses the development Blob store. */
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

  test("confirms release when an internal file is attached to a message", async ({
    page,
    browser,
  }) => {
    const name = `Chat intern ${Date.now().toString(36)}`;
    await page.goto(`/de/crm?cockpit=${fixture.filesCustomer}`);
    await page.getByRole("button", { name: "Link hinzufügen" }).click();
    const linkDialog = page.getByRole("dialog", { name: "Link hinzufügen" });
    await linkDialog.getByLabel("Bezeichnung").fill(name);
    await linkDialog
      .getByRole("textbox", { name: /^Link/ })
      .fill(`https://example.com/${encodeURIComponent(name)}`);
    await linkDialog.getByRole("button", { name: "Link speichern" }).click();
    await expect(linkDialog).toBeHidden();

    await page.getByRole("button", { name: "Kundenchat öffnen" }).click();
    await page.getByRole("button", { name: "Datei anhängen" }).click();
    await page.getByRole("button", { name: "Vorhandene Datei wählen" }).click();
    const picker = page.getByRole("dialog", {
      name: "Vorhandene Datei wählen",
    });
    await picker.getByRole("checkbox", { name: `${name} anhängen` }).check();
    await picker.getByRole("button", { name: "Anhängen" }).click();
    await expect(picker).toBeHidden();
    await page
      .getByRole("textbox", { name: "Nachricht an den Kunden" })
      .fill("Hier ist der Link.");
    let sendRequests = 0;
    page.on("request", (request) => {
      if (
        request
          .url()
          .endsWith(
            `/api/workspace/crm/customers/${fixture.filesCustomer}/conversation/messages`,
          ) &&
        request.method() === "POST"
      )
        sendRequests += 1;
    });
    await page.getByRole("button", { name: "Senden", exact: true }).click();
    const confirmation = page.getByRole("dialog", {
      name: "Dateien für den Kunden freigeben?",
    });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole("button", { name: "Abbrechen" }).click();
    await expect(confirmation).toBeHidden();
    expect(sendRequests).toBe(0);

    await page.getByRole("button", { name: "Senden", exact: true }).click();
    const sent = page.waitForResponse(
      (response) =>
        response
          .url()
          .endsWith(
            `/api/workspace/crm/customers/${fixture.filesCustomer}/conversation/messages`,
          ) && response.request().method() === "POST",
    );
    await confirmation
      .getByRole("button", { name: "Freigeben und senden" })
      .click();
    expect((await sent).ok()).toBe(true);
    expect(sendRequests).toBe(1);
    await expect(page.getByText("Hier ist der Link.")).toBeVisible();
    const contactContext = await browser.newContext({
      storageState: portalE2ePaths.filesContactState,
    });
    try {
      const contact = await contactContext.newPage();
      await contact.goto(`/de/portal/${fixture.filesCustomer}/files`);
      await expect(
        contact.getByRole("link", { name: new RegExp(name) }).first(),
      ).toBeVisible();
    } finally {
      await contactContext.close();
    }
  });

  test("uploads and releases a real file, downloads it and receives a customer upload", async ({
    page,
    browser,
  }) => {
    test.skip(
      process.env.E2E_LIVE_BLOB !== "true",
      "Requires the private development Blob store and explicit live-test opt-in.",
    );
    test.setTimeout(180_000);
    const suffix = Date.now().toString(36);
    const internalName = `internal-${suffix}.txt`;
    const customerName = `customer-${suffix}.txt`;
    await page.goto(`/de/crm?cockpit=${fixture.filesCustomer}`);
    await page.getByRole("button", { name: "Datei hochladen" }).click();
    const uploadDialog = page.getByRole("dialog", {
      name: "Dateien hochladen",
    });
    await uploadDialog.locator('input[type="file"]').setInputFiles({
      name: internalName,
      mimeType: "text/plain",
      buffer: Buffer.from(`Internal file ${suffix}`, "utf8"),
    });
    const completed = page.waitForResponse(
      (response) =>
        /\/api\/workspace\/crm\/files\/[^/]+\/complete$/.test(response.url()) &&
        response.request().method() === "POST",
    );
    await uploadDialog
      .getByRole("button", { name: "1 Datei hochladen" })
      .click();
    const completedResponse = await completed;
    expect(completedResponse.ok()).toBe(true);
    const uploaded = (await completedResponse.json()) as { id: string };
    await expect(
      uploadDialog.getByText("Hochgeladen", { exact: true }),
    ).toBeVisible();
    await uploadDialog
      .getByRole("button", { name: "Schließen" })
      .last()
      .click();

    const contactContext = await browser.newContext({
      storageState: portalE2ePaths.filesContactState,
      acceptDownloads: true,
    });
    try {
      const contact = await contactContext.newPage();
      await contact.goto(`/de/portal/${fixture.filesCustomer}/files`);
      await expect(contact.getByText(internalName)).toHaveCount(0);
      expect(
        (
          await contact.request.get(
            `/api/portal/${fixture.filesCustomer}/files/${uploaded.id}/download-url`,
          )
        ).status(),
      ).toBe(404);

      await page
        .getByRole("button", { name: `${internalName} bearbeiten` })
        .click();
      const editDialog = page.getByRole("dialog", { name: "Datei bearbeiten" });
      await editDialog.getByLabel("Für den Kunden sichtbar").check();
      await editDialog
        .getByRole("button", { name: "Änderungen speichern" })
        .click();
      await expect(editDialog).toBeHidden();

      await contact.reload();
      await expect(contact.getByText(internalName).first()).toBeVisible();
      const fileDownload = contact.waitForEvent("download");
      await contact
        .getByRole("button", { name: `${internalName} herunterladen` })
        .click();
      const single = await fileDownload;
      expect(single.suggestedFilename()).toBe(internalName);
      expect(await readFile(await single.path(), "utf8")).toBe(
        `Internal file ${suffix}`,
      );
      await contact
        .getByRole("checkbox", { name: `${internalName} für ZIP auswählen` })
        .check();
      const archiveRoute = `**/api/portal/${fixture.filesCustomer}/files/archive?**`;
      await contact.route(archiveRoute, async (route) => {
        if (route.request().method() !== "GET") return route.continue();
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ code: "FILE_NOT_FOUND" }),
        });
      });
      await contact
        .getByRole("button", { name: "Als ZIP herunterladen" })
        .click();
      await expect(
        contact.getByRole("alert").filter({
          hasText: "Diese Datei ist nicht mehr verfügbar",
        }),
      ).toBeVisible();
      await contact.unroute(archiveRoute);
      await contact
        .getByRole("checkbox", { name: `${internalName} für ZIP auswählen` })
        .check();
      const archiveDownload = contact.waitForEvent("download");
      await contact
        .getByRole("button", { name: "Als ZIP herunterladen" })
        .click();
      const archive = await archiveDownload;
      expect(archive.suggestedFilename()).toBe("dateien.zip");
      const entries = unzipSync(
        new Uint8Array(await readFile(await archive.path())),
      );
      expect(new TextDecoder().decode(entries[internalName])).toBe(
        `Internal file ${suffix}`,
      );

      await contact
        .locator('input[type="file"]')
        .first()
        .setInputFiles({
          name: customerName,
          mimeType: "text/plain",
          buffer: Buffer.from(`Customer file ${suffix}`, "utf8"),
        });
      const customerUploadDialog = contact.getByRole("dialog", {
        name: "Dateien hochladen",
      });
      await customerUploadDialog
        .getByRole("button", { name: "1 Datei hochladen" })
        .click();
      await expect(
        customerUploadDialog.getByText("Hochgeladen", { exact: true }),
      ).toBeVisible();
      await customerUploadDialog
        .getByRole("button", { name: "Fertig" })
        .last()
        .click();
      await expect(contact.getByText(customerName).first()).toBeVisible();

      await page.reload();
      await expect(page.getByText(customerName).first()).toBeVisible();
    } finally {
      await contactContext.close();
    }
  });
});
