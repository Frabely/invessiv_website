import { expect, type Page, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  type PortalE2eFixture,
  portalE2ePaths,
} from "./support/portal-e2e-fixture";

let fixture: PortalE2eFixture;

function feedbackPath(customerId: string, projectId: string) {
  return `/de/portal/${customerId}/projects/${projectId}/feedback`;
}

function isDraftSave(roundId: string) {
  return (response: { url(): string; request(): { method(): string } }) =>
    response.url().endsWith(`/feedback-rounds/${roundId}/draft`) &&
    response.request().method() === "PUT";
}

async function handOver(page: Page, projectId: string) {
  const response = await page.request.post(
    `/api/workspace/crm/projects/${projectId}/feedback-rounds`,
    { data: { areaOptions: ["Startseite", "Kontakt"] } },
  );
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { id: string }).id;
}

/** Handover, two contacts on one draft, submission and the approval without changes. */
test.describe.serial("portal feedback", () => {
  test.use({ storageState: portalE2ePaths.managerState });

  test.beforeAll(async () => {
    fixture = JSON.parse(
      await readFile(portalE2ePaths.fixture, "utf8"),
    ) as PortalE2eFixture;
  });

  test("hands over, collects a draft from two contacts and submits it", async ({
    page,
    browser,
  }, testInfo) => {
    const suffix = Date.now().toString(36);
    const cockpit = `/de/crm?cockpit=${fixture.feedbackCustomer}&project=${fixture.feedbackProject}`;

    await page.goto(cockpit);
    await page.getByRole("button", { name: "Runde 1 übergeben" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Feedbackrunde 1 übergeben",
    });
    await dialog.getByLabel("Was ist neu").fill(`Erste Version ${suffix}`);
    const handedOver = page.waitForResponse(
      (response) =>
        response
          .url()
          .endsWith(`/projects/${fixture.feedbackProject}/feedback-rounds`) &&
        response.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "Runde übergeben" }).click();
    const handoverResponse = await handedOver;
    expect(handoverResponse.ok()).toBe(true);
    const roundId = ((await handoverResponse.json()) as { id: string }).id;
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`feedbackRound=${roundId}`));

    // A second handover (double click, second tab) never creates a second round.
    const again = await page.request.post(
      `/api/workspace/crm/projects/${fixture.feedbackProject}/feedback-rounds`,
      { data: { areaOptions: [] } },
    );
    expect(again.status()).toBe(409);

    const contactA = await browser.newContext({
      storageState: portalE2ePaths.filesContactState,
    });
    const contactB = await browser.newContext({
      storageState: portalE2ePaths.feedbackContactState,
    });
    try {
      const a = await contactA.newPage();
      const b = await contactB.newPage();
      const url = feedbackPath(
        fixture.feedbackCustomer,
        fixture.feedbackProject,
      );

      await a.goto(url);
      await expect(a.getByText("Feedbackrunde 1 von 2")).toBeVisible();
      await expect(a.getByText(`Erste Version ${suffix}`)).toBeVisible();
      await a.getByRole("button", { name: "Punkt hinzufügen" }).click();
      await a.getByLabel("Bereich").first().selectOption("Startseite");
      let saved = a.waitForResponse(isDraftSave(roundId));
      await a.getByRole("textbox").first().fill(`Hero zu dunkel ${suffix}`);
      expect((await saved).ok()).toBe(true);
      await expect(a.getByText(/Gespeichert/)).toBeVisible();

      await a.reload();
      await expect(a.getByRole("textbox").first()).toHaveValue(
        `Hero zu dunkel ${suffix}`,
      );

      // B reads the draft, A saves again, then B's save is stale.
      await b.goto(url);
      await expect(b.getByRole("textbox").first()).toHaveValue(
        `Hero zu dunkel ${suffix}`,
      );
      saved = a.waitForResponse(isDraftSave(roundId));
      await a.getByRole("button", { name: "Punkt hinzufügen" }).click();
      await a.getByRole("textbox").nth(1).fill(`Telefonnummer fehlt ${suffix}`);
      expect((await saved).ok()).toBe(true);

      const stale = b.waitForResponse(isDraftSave(roundId));
      await b.getByRole("textbox").first().fill(`Meine Fassung ${suffix}`);
      expect((await stale).status()).toBe(409);
      await expect(
        b.getByRole("alert").getByText("Jemand anderes hat gerade gespeichert"),
      ).toBeVisible();
      await expect(
        b.getByRole("button", { name: "Meine Fassung wiederherstellen" }),
      ).toBeVisible();
      await b.getByRole("button", { name: "Neuesten Stand behalten" }).click();

      await a.getByRole("button", { name: "Feedback einreichen" }).click();
      const submitDialog = a.getByRole("dialog", {
        name: "Feedback einreichen?",
      });
      await expect(submitDialog.getByText("2 Punkte").first()).toBeVisible();
      await submitDialog
        .getByRole("button", { name: "Jetzt einreichen" })
        .click();
      await expect(
        a.getByText("Eingereicht – wir sichten dein Feedback"),
      ).toBeVisible();
      await expect(a.getByRole("textbox")).toHaveCount(0);

      for (const viewport of [
        { name: "desktop", width: 1280, height: 900 },
        { name: "mobile", width: 360, height: 800 },
      ]) {
        await a.setViewportSize(viewport);
        const overflow = await a.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(overflow).toBe(false);
        await a.screenshot({
          path: testInfo.outputPath(`portal-feedback-${viewport.name}.png`),
          fullPage: true,
        });
      }

      // A project of another company answers exactly like a missing one.
      const foreign = await b.goto(
        feedbackPath(fixture.filesCustomer, fixture.feedbackProject),
      );
      expect(foreign?.status()).toBe(404);
    } finally {
      await contactA.close();
      await contactB.close();
    }

    const internal = await page.request.get(
      `/api/workspace/crm/feedback-rounds/${roundId}`,
    );
    expect(internal.ok()).toBe(true);
    const round = (await internal.json()) as {
      status: string;
      items: { body: string }[];
    };
    expect(round.status).toBe("submitted");
    expect(round.items.map((item) => item.body)).toEqual([
      `Hero zu dunkel ${suffix}`,
      `Telefonnummer fehlt ${suffix}`,
    ]);

    await page.goto(`${cockpit}&feedbackRound=${roundId}`);
    await expect(page.getByText(`Hero zu dunkel ${suffix}`)).toBeVisible();
    await expect(page.getByText(/Eingereicht von/)).toBeVisible();
  });

  test("approves a project without changes only with the confirmation", async ({
    page,
    browser,
  }) => {
    await handOver(page, fixture.feedbackApprovalProject);

    const contact = await browser.newContext({
      storageState: portalE2ePaths.feedbackContactState,
    });
    try {
      const b = await contact.newPage();
      await b.goto(
        feedbackPath(fixture.feedbackCustomer, fixture.feedbackApprovalProject),
      );
      await b
        .getByRole("button", { name: "Projekt ohne Änderungen freigeben" })
        .click();
      const dialog = b.getByRole("dialog", { name: "Projekt freigeben?" });
      const confirm = dialog.getByRole("button", { name: "Projekt freigeben" });
      await expect(confirm).toBeDisabled();
      await dialog
        .getByRole("checkbox", {
          name: "Ich habe alles geprüft und gebe das Projekt frei.",
        })
        .check();
      await confirm.click();
      await expect(b.getByText(/Freigegeben am/)).toBeVisible();

      await b.goto(`/de/portal/${fixture.feedbackCustomer}`);
      const widget = b.getByRole("region", { name: "Feedback" });
      await expect(widget.getByText("Abgenommen")).toBeVisible();
    } finally {
      await contact.close();
    }
  });
});
