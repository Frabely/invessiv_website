import { expect, test } from "@playwright/test";

const emptyStorageState = { cookies: [], origins: [] };
// The session needs hours.read, hours.write and hours.manage on the fixture customer.
const hoursManagerState =
  process.env.E2E_HOURS_MANAGER_STORAGE_STATE ?? emptyStorageState;
const hoursCustomerId = process.env.E2E_HOURS_CUSTOMER_ID;
const hoursProjectTitle = process.env.E2E_HOURS_PROJECT_TITLE;

test.describe("hours manager", () => {
  test.use({ storageState: hoursManagerState });

  test.beforeEach(() => {
    test.skip(
      typeof hoursManagerState !== "string" ||
        !hoursCustomerId ||
        !hoursProjectTitle,
      "Configure the hours-manager Clerk session and fixture values.",
    );
  });

  test("adds hours, allocates them, books time and releases the rest", async ({
    page,
  }) => {
    const description = `E2E Buchung ${Date.now()}`;

    const response = await page.goto(`/de/crm?cockpit=${hoursCustomerId}`);
    expect(response?.status()).toBe(200);

    // Purchase: every run adds its own two hours, so the test does not depend on earlier runs.
    await page
      .getByRole("button", { name: "Stunden gutschreiben", exact: true })
      .first()
      .click();
    const purchase = page.getByRole("dialog", { name: "Stunden gutschreiben" });
    await purchase.getByRole("textbox", { name: /Stunden/ }).fill("2:00");
    await purchase.getByRole("textbox", { name: "Notiz" }).fill("E2E Paket");
    await purchase
      .getByRole("button", { name: "Stunden gutschreiben", exact: true })
      .click();
    await expect(purchase).toBeHidden();

    // Allocation: the two new hours go to the fixture project.
    await page
      .getByRole("button", { name: `Zuweisen: ${hoursProjectTitle}` })
      .click();
    const allocation = page.getByRole("dialog", { name: "Stunden zuweisen" });
    await allocation.getByRole("textbox", { name: /Stunden/ }).fill("2:00");
    await allocation
      .getByRole("button", { name: "Stunden zuweisen", exact: true })
      .click();
    await expect(allocation).toBeHidden();

    // Booking on the project tab.
    await page
      .getByRole("tab", { name: hoursProjectTitle, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Zeit buchen", exact: true })
      .click();
    const booking = page.getByRole("dialog", { name: "Zeit buchen" });
    await booking.getByRole("textbox", { name: /Dauer/ }).fill("0:45");
    await booking
      .getByRole("textbox", { name: /Beschreibung/ })
      .fill(description);
    await expect(
      booking.getByText("Für den Kunden sichtbar", { exact: false }),
    ).toBeVisible();
    await booking
      .getByRole("button", { name: "Zeit buchen", exact: true })
      .click();
    await expect(booking).toBeHidden();

    await page
      .getByRole("button", { name: "Stunden aufklappen" })
      .last()
      .click();
    await expect(page.getByText(description, { exact: true })).toBeVisible();

    // Delete the entry again, then hand the unused hours back.
    await page
      .getByRole("listitem")
      .filter({ hasText: description })
      .getByRole("button", { name: /^Löschen/ })
      .click();
    await page
      .getByRole("dialog", { name: "Zeitbuchung löschen?" })
      .getByRole("button", { name: "Buchung löschen" })
      .click();
    await expect(page.getByText(description, { exact: true })).toBeHidden();

    await page
      .getByRole("button", { name: `Freigeben: ${hoursProjectTitle}` })
      .click();
    const release = page.getByRole("dialog", { name: "Stunden freigeben" });
    await release.getByRole("textbox", { name: /Stunden/ }).fill("2:00");
    await release
      .getByRole("button", { name: "Stunden freigeben", exact: true })
      .click();
    await expect(release).toBeHidden();
  });
});
