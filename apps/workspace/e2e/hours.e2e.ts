import { expect, test, type Locator } from "@playwright/test";
import { formatDuration } from "@invessiv/common/patterns/crm/hours/format-duration";
import { parseDuration } from "@invessiv/common/patterns/crm/hours/parse-duration";

const emptyStorageState = { cookies: [], origins: [] };
// The session needs hours.read, hours.write, hours.manage and tasks.read on the fixture customer.
const hoursManagerState =
  process.env.E2E_HOURS_MANAGER_STORAGE_STATE ?? emptyStorageState;
const hoursCustomerId = process.env.E2E_HOURS_CUSTOMER_ID;
const hoursProjectTitle = process.env.E2E_HOURS_PROJECT_TITLE;

async function setDuration(dialog: Locator, hours: number, minutes: number) {
  const hourPart = dialog.getByRole("spinbutton", { name: /Stunden/ });
  const minutePart = dialog.getByRole("spinbutton", {
    name: "Minuten",
    exact: true,
  });
  await hourPart.press("Home");
  await minutePart.press("Home");
  for (let step = 0; step < hours; step++) await hourPart.press("ArrowUp");
  for (let step = 0; step < minutes / 15; step++)
    await minutePart.press("ArrowUp");
  await expect(hourPart).toHaveAttribute("aria-valuenow", String(hours));
  await expect(minutePart).toHaveAttribute("aria-valuenow", String(minutes));
}

function remainingLabel(minutes: number) {
  return minutes < 0
    ? `${formatDuration(-minutes)} überzogen`
    : `${formatDuration(minutes)} übrig`;
}

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
    await setDuration(purchase, 2, 0);
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
    await setDuration(allocation, 2, 0);
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
    const initialForecast = await booking
      .getByText(/^Rest danach:|^Überzieht das Projekt/)
      .innerText();
    const duration = initialForecast.match(/\d+:\d{2}/)?.[0];
    expect(duration).toBeTruthy();
    const beforeBooking =
      parseDuration(duration!)! *
      (initialForecast.startsWith("Überzieht") ? -1 : 1);
    // The isolated fixture starts without an overdraw, so the two new hours can be released again.
    expect(beforeBooking).toBeGreaterThanOrEqual(120);
    await booking.getByLabel("Aufgabe", { exact: true }).click();
    const taskOption = page
      .getByRole("option")
      .filter({ hasNotText: "Keine Aufgabe" })
      .first();
    const taskTitle = await taskOption.innerText();
    await taskOption.click();
    await setDuration(booking, 0, 45);
    const expectedForecast = beforeBooking - 45;
    await expect(
      booking.getByText(
        expectedForecast < 0
          ? `Überzieht das Projekt um ${formatDuration(-expectedForecast)}. Die Buchung wird trotzdem gespeichert.`
          : `Rest danach: ${formatDuration(expectedForecast)}`,
        { exact: true },
      ),
    ).toBeVisible();
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
    const panel = page.getByRole("tabpanel");
    await expect(
      panel.getByText(remainingLabel(beforeBooking - 45), { exact: true }),
    ).toBeVisible();

    const expandHours = panel.getByRole("button", {
      name: "Stunden aufklappen",
    });
    if (await expandHours.isVisible()) await expandHours.click();
    await expect(page.getByText(description, { exact: true })).toBeVisible();
    const entryRow = panel
      .getByRole("listitem")
      .filter({ hasText: description });
    await expect(entryRow).toContainText(taskTitle);

    await entryRow.getByRole("button", { name: /^Ändern:/ }).click();
    const edit = page.getByRole("dialog", { name: "Zeitbuchung ändern" });
    await setDuration(edit, 1, 30);
    await edit.getByRole("button", { name: "Änderung speichern" }).click();
    await expect(edit).toBeHidden();
    await expect(entryRow).toContainText("1:30");
    await expect(
      panel.getByText(remainingLabel(beforeBooking - 90), { exact: true }),
    ).toBeVisible();

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
    await expect(
      panel.getByText(remainingLabel(beforeBooking), { exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: `Freigeben: ${hoursProjectTitle}` })
      .click();
    const release = page.getByRole("dialog", { name: "Stunden freigeben" });
    await setDuration(release, 2, 0);
    await release
      .getByRole("button", { name: "Stunden freigeben", exact: true })
      .click();
    await expect(release).toBeHidden();
  });
});
