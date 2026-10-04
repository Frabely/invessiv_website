import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import {
  type PortalE2eFixture,
  portalE2ePaths,
} from "./support/portal-e2e-fixture";

let fixture: PortalE2eFixture;

test.describe("portal tasks", () => {
  test.use({ storageState: portalE2ePaths.filesContactState });

  test.beforeAll(async () => {
    fixture = JSON.parse(
      await readFile(portalE2ePaths.fixture, "utf8"),
    ) as PortalE2eFixture;
  });

  test("creates a customer request through the dialog and shows it in the team list", async ({
    page,
  }) => {
    const title = `E2E customer request ${Date.now()}`;
    await page.goto(
      `/de/portal/${fixture.feedbackCustomer}?project=${fixture.taskProject}`,
    );

    const teamTasks = page.getByRole("region", { name: "Daran arbeiten wir" });
    await teamTasks
      .getByRole("button", { name: "Aufgabe für uns anlegen" })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Aufgabe für uns anlegen",
    });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Aufgabe anlegen" }).click();
    await expect(
      dialog.getByText("Schreib kurz, was wir tun sollen."),
    ).toBeVisible();

    await dialog
      .getByRole("textbox", { name: "Was sollen wir tun?" })
      .fill(title);
    await dialog
      .getByRole("textbox", { name: "Details" })
      .fill("Portal E2E request");
    const created = page.waitForResponse(
      (response) =>
        response
          .url()
          .endsWith(`/api/portal/${fixture.feedbackCustomer}/tasks`) &&
        response.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "Aufgabe anlegen" }).click();
    expect((await created).status()).toBe(201);
    await expect(dialog).toBeHidden();
    await expect(teamTasks.getByText(title)).toBeVisible();
    await expect(teamTasks.getByText("von dir")).toBeVisible();
  });

  test("reopens a portal completion and keeps the team's completion locked", async ({
    page,
  }) => {
    await page.goto(
      `/de/portal/${fixture.feedbackCustomer}?project=${fixture.taskProject}`,
    );
    const customerTasks = page.getByRole("region", {
      name: "Von dir benötigt",
    });
    const open = customerTasks.getByRole("checkbox", {
      name: "„E2E customer task“ als erledigt markieren",
    });
    await expect(open).toBeEnabled();
    const completed = page.waitForResponse(
      (response) =>
        response
          .url()
          .endsWith(
            `/api/portal/${fixture.feedbackCustomer}/tasks/${fixture.customerTaskId}/complete`,
          ) && response.request().method() === "POST",
    );
    await open.check();
    expect((await completed).status()).toBe(200);

    const reopen = customerTasks.getByRole("checkbox", {
      name: "Haken bei „E2E customer task“ zurücknehmen",
    });
    await expect(reopen).toBeEnabled();
    await expect(reopen).toBeChecked();
    await expect(
      customerTasks.getByRole("checkbox", {
        name: "„E2E team-completed task“ ist erledigt",
      }),
    ).toBeDisabled();

    const reopened = page.waitForResponse(
      (response) =>
        response
          .url()
          .endsWith(
            `/api/portal/${fixture.feedbackCustomer}/tasks/${fixture.customerTaskId}/reopen`,
          ) && response.request().method() === "POST",
    );
    await reopen.uncheck();
    expect((await reopened).status()).toBe(200);
    await expect(open).toBeEnabled();
    await expect(open).not.toBeChecked();
  });
});
