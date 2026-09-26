import { expect, test } from "@playwright/test";

const emptyStorageState = { cookies: [], origins: [] };
const taskWriterState =
  process.env.E2E_TASK_WRITER_STORAGE_STATE ?? emptyStorageState;
const taskCustomerId = process.env.E2E_TASK_CUSTOMER_ID;
const taskProjectTitle = process.env.E2E_TASK_PROJECT_TITLE;

test.describe("task writer", () => {
  test.use({ storageState: taskWriterState });

  test.beforeEach(() => {
    test.skip(
      typeof taskWriterState !== "string" ||
        !taskCustomerId ||
        !taskProjectTitle,
      "Configure the task-writer Clerk session and fixture values.",
    );
  });

  test("creates a task in the customer cockpit and changes its status", async ({
    page,
  }) => {
    const taskTitle = `E2E task ${Date.now()}`;

    const response = await page.goto(`/de/crm?cockpit=${taskCustomerId}`);
    expect(response?.status()).toBe(200);

    await page
      .getByRole("tab", { name: taskProjectTitle, exact: true })
      .click();
    await page.getByRole("button", { name: "Aufgabe anlegen" }).click();
    const dialog = page.getByRole("dialog", { name: "Aufgabe anlegen" });
    await dialog.getByRole("textbox", { name: /Titel/ }).fill(taskTitle);
    await dialog.getByRole("button", { name: "Aufgabe anlegen" }).click();

    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible();

    const statusControl = page.getByRole("button", {
      name: `Status von „${taskTitle}“`,
    });
    await statusControl.click();
    await page.getByRole("option", { name: "In Arbeit", exact: true }).click();

    await expect(
      page.getByRole("status").filter({ hasText: "ist jetzt in arbeit" }),
    ).toBeVisible();
  });
});
