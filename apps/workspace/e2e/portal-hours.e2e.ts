import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import type { PortalTimeEntryPageDto } from "@invessiv/common/contracts/portal/portal-time-entry-page.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  PORTAL_HOURS_ALL_PROJECTS,
  PortalDashboardQueryParam,
} from "@/common/constants/portal/portal-dashboard-query-params";
import { PortalHoursQueryParam } from "@/common/constants/portal/portal-hours-query-params";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { portalHoursEntriesEndpoint } from "@/common/patterns/portal/portal-api-endpoints";
import dashboard from "@/i18n/dictionaries/portal/dashboard/de.json";
import content from "@/i18n/dictionaries/portal/hours/de.json";
import { portalPathFor } from "@/lib/auth/routes";
import {
  type PortalE2eFixture,
  portalE2ePaths,
} from "./support/portal-e2e-fixture";

let fixture: PortalE2eFixture;
const HOURS_DIALOG = `?${PortalDashboardQueryParam.Widget}=${PortalWidgetKey.Hours}`;
// The dialog follows the dashboard project; the checks below read the company-wide view.
const HOURS_DIALOG_ALL = `${HOURS_DIALOG}&${PortalDashboardQueryParam.HoursProject}=${PORTAL_HOURS_ALL_PROJECTS}`;

test.beforeAll(async () => {
  fixture = JSON.parse(
    await readFile(portalE2ePaths.fixture, "utf8"),
  ) as PortalE2eFixture;
});

test("shows hours to contacts by right and company, read-only, with real Clerk sessions", async ({
  browser,
}, testInfo) => {
  // Standard role on the hours customer.
  const standard = await browser.newContext({
    storageState: portalE2ePaths.filesContactState,
  });
  // Summary-only role on the hours customer, standard role on the other one.
  const limited = await browser.newContext({
    storageState: portalE2ePaths.feedbackContactState,
  });
  const manager = await browser.newContext({
    storageState: portalE2ePaths.managerState,
  });
  const anonymous = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const endpoint = portalHoursEntriesEndpoint(fixture.hoursCustomer);
  const otherEndpoint = portalHoursEntriesEndpoint(fixture.hoursOtherCustomer);

  try {
    expect((await anonymous.request.get(endpoint)).status()).toBe(401);
    // No membership at the other company: the same answer as for a company that does not exist.
    expect((await standard.request.get(otherEndpoint)).status()).toBe(404);
    expect((await limited.request.get(endpoint)).status()).toBe(404);

    const listed = await standard.request.get(endpoint);
    expect(listed.status()).toBe(200);
    expect(listed.headers()["cache-control"]).toContain("no-store");
    const page1 = (await listed.json()) as PortalTimeEntryPageDto;
    expect(page1.entries.map((entry) => entry.description).sort()).toEqual([
      "Kleine Textkorrektur",
      "Kontaktformular",
      "Produktseiten",
      "Umbau Hero-Section",
    ]);
    const serialized = JSON.stringify(page1);
    for (const key of ["performedByMemberId", "version", "customerId"])
      expect(serialized).not.toContain(`"${key}"`);
    expect(
      (
        await standard.request.get(
          `${endpoint}?${PortalHoursQueryParam.ProjectId}=${fixture.credentialsProject}`,
        )
      ).status(),
    ).toBe(422);
    const filtered = await standard.request.get(
      `${endpoint}?${PortalHoursQueryParam.ProjectId}=${fixture.hoursProjectB}`,
    );
    expect(
      ((await filtered.json()) as PortalTimeEntryPageDto).entries.map(
        (entry) => entry.description,
      ),
    ).toEqual(["Produktseiten"]);

    const page = await standard.newPage();
    await page.goto(portalPathFor("de", fixture.hoursCustomer));
    const widget = page.getByRole("region", {
      name: dashboard.widgets.hours.title,
      exact: true,
    });
    await expect(widget).toContainText("1:30");
    await expect(widget).toContainText(dashboard.widgets.hours.remaining);
    await expect(
      widget.getByText("8:30 von 10:00 verbraucht", { exact: true }),
    ).toBeVisible();

    await widget
      .getByRole("button", { name: dashboard.widgets.hours.open })
      .click();
    const dialog = page.getByRole("dialog", {
      name: content.dialog.title,
      exact: true,
    });
    await expect(dialog).toBeVisible();
    // The dialog follows the dashboard project; the overview is one step back.
    const back = dialog.getByRole("button", { name: content.projects.back });
    if (await back.isVisible()) await back.click();
    const totals = dialog.getByRole("group", { name: content.figures.label });
    await expect(totals).toContainText("10:00");
    await expect(totals).toContainText("8:30");
    // Website still has 2:30; the overdrawn Shop adds nothing, nothing is unassigned.
    await expect(totals).toContainText(content.figures.open);
    await expect(totals).toContainText("2:30");
    await expect(totals).toContainText("0:00");

    const entries = dialog.getByRole("tabpanel", {
      name: content.tabs.entries,
    });
    await expect(
      entries.getByText("Umbau Hero-Section", { exact: true }),
    ).toBeVisible();
    await expect(
      entries.getByText(content.entries.goodwill, { exact: true }),
    ).toHaveCount(1);
    await expect(dialog.getByText("E2E internal allocation note")).toHaveCount(
      0,
    );

    await expect(
      dialog.getByRole("button", { name: /^Hours Website/ }),
    ).toContainText("2:30");
    await expect(
      dialog.getByRole("button", { name: /^Hours Shop/ }),
    ).toContainText("Dieses Projekt hat 1:00 mehr verbraucht als zugewiesen.");

    await dialog.getByRole("tab", { name: content.tabs.purchases }).click();
    await expect(
      dialog.getByText("Betreuung nach dem Launch", { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByText("+10:00", { exact: true })).toBeVisible();

    await dialog.getByRole("button", { name: /^Hours Shop/ }).click();
    const shopTotals = dialog.getByRole("group", {
      name: formatMessage(content.figures.projectLabel, {
        project: "Hours Shop",
      }),
    });
    await expect(shopTotals).toBeVisible();
    // Purchases belong to the company and stay in the overview.
    await expect(dialog.getByText("Betreuung nach dem Launch")).toHaveCount(0);
    await expect(
      dialog.getByText("Produktseiten", { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByText("Umbau Hero-Section", { exact: true }),
    ).toHaveCount(0);
    expect(new URL(page.url()).searchParams.get("hoursProject")).toBe(
      fixture.hoursProjectB,
    );

    for (const theme of ["dark", "light"] as const) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      for (const width of [360, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(shopTotals).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth,
          ),
        ).toBe(false);
        await page.screenshot({
          path: testInfo.outputPath(`hours-dialog-${theme}-${width}.png`),
        });
      }
    }
    await dialog
      .getByRole("button", { name: content.dialog.close, exact: true })
      .focus();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(new URL(page.url()).search).toBe("");

    // The balance without the detail right: no list, no heading, no hint that something is missing.
    const limitedPage = await limited.newPage();
    await limitedPage.goto(
      portalPathFor("de", fixture.hoursCustomer) + HOURS_DIALOG_ALL,
    );
    const limitedDialog = limitedPage.getByRole("dialog", {
      name: content.dialog.title,
      exact: true,
    });
    await expect(
      limitedDialog.getByRole("group", { name: content.figures.label }),
    ).toContainText("8:30");
    await expect(
      limitedDialog.getByRole("tab", { name: content.tabs.entries }),
    ).toHaveCount(0);
    await expect(limitedDialog.getByText("Umbau Hero-Section")).toHaveCount(0);

    // The same person at a second company sees that company's numbers and entries only.
    await limitedPage.goto(portalPathFor("de", fixture.hoursOtherCustomer));
    await expect(
      limitedPage.getByRole("region", {
        name: dashboard.widgets.hours.title,
        exact: true,
      }),
    ).toContainText("1:45");
    const otherList = await limited.request.get(otherEndpoint);
    expect(otherList.status()).toBe(200);
    expect(
      ((await otherList.json()) as PortalTimeEntryPageDto).entries.map(
        (entry) => entry.description,
      ),
    ).toEqual(["Fremde Buchung"]);

    // The owner reads the same view through "view portal".
    expect((await manager.request.get(endpoint)).status()).toBe(200);
    const ownerPage = await manager.newPage();
    await ownerPage.goto(
      portalPathFor("de", fixture.hoursCustomer) + HOURS_DIALOG_ALL,
    );
    await expect(
      ownerPage
        .getByRole("dialog", { name: content.dialog.title, exact: true })
        .getByText("Umbau Hero-Section", { exact: true }),
    ).toBeVisible();

    // A company without a purchase and without a time entry has no hours widget at all.
    await page.goto(portalPathFor("de", fixture.filesCustomer));
    await expect(
      page.getByRole("region", { name: dashboard.widgets.files.title }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", {
        name: dashboard.widgets.hours.title,
        exact: true,
      }),
    ).toHaveCount(0);
  } finally {
    await Promise.all([
      standard.close(),
      limited.close(),
      manager.close(),
      anonymous.close(),
    ]);
  }
});
