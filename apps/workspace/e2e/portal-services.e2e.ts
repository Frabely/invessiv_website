import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import type { CreatePortalServiceRequestDto } from "@invessiv/common/contracts/portal/create-portal-service-request.dto";
import {
  PORTAL_SERVICE_REQUEST_CUSTOM,
  PortalDashboardQueryParam,
} from "@/common/constants/portal/portal-dashboard-query-params";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { portalServiceRequestsEndpoint } from "@/common/patterns/portal/portal-api-endpoints";
import dashboard from "@/i18n/dictionaries/portal/dashboard/de.json";
import content from "@/i18n/dictionaries/portal/service-requests/de.json";
import { portalPathFor } from "@/lib/auth/routes";
import { PORTAL_E2E_PREFIX } from "@/test/constants/portal-e2e-prefix";
import {
  type PortalE2eFixture,
  portalE2ePaths,
} from "./support/portal-e2e-fixture";

let fixture: PortalE2eFixture;
const DIALOG = `?${PortalDashboardQueryParam.Widget}=${PortalWidgetKey.ServiceRequest}`;

test.beforeAll(async () => {
  fixture = JSON.parse(
    await readFile(portalE2ePaths.fixture, "utf8"),
  ) as PortalE2eFixture;
});

test("lets a contact request services, follow and withdraw them, isolated by company, with real Clerk sessions", async ({
  browser,
}, testInfo) => {
  // Standard role on the hours customer.
  const contact = await browser.newContext({
    storageState: portalE2ePaths.filesContactState,
  });
  // Summary-only role on the hours customer, standard role on the other one.
  const other = await browser.newContext({
    storageState: portalE2ePaths.feedbackContactState,
  });
  const anonymous = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const endpoint = portalServiceRequestsEndpoint(fixture.hoursCustomer);
  const freeText: CreatePortalServiceRequestDto = {
    idempotencyKey: randomUUID(),
    lineItemTemplateId: null,
    title: "E2E anonymous request",
    note: "Should never arrive",
    requestedMinutes: null,
    projectWish: ServiceRequestProjectWish.New,
    projectId: null,
  };

  try {
    expect(
      (await anonymous.request.post(endpoint, { data: freeText })).status(),
    ).toBe(HttpResponseCode.Unauthorized);
    // No request right on this company: the same answer as for a company that does not exist.
    expect(
      (await other.request.post(endpoint, { data: freeText })).status(),
    ).toBe(HttpResponseCode.NotFound);
    // A project of another company is rejected without confirming that it exists.
    const foreignProject = await other.request.post(
      portalServiceRequestsEndpoint(fixture.hoursOtherCustomer),
      {
        data: {
          ...freeText,
          idempotencyKey: randomUUID(),
          projectWish: ServiceRequestProjectWish.Existing,
          projectId: fixture.hoursProjectA,
        },
      },
    );
    expect(foreignProject.status()).toBe(HttpResponseCode.UnprocessableContent);
    expect(
      foreignProject.headers()[HttpHeaderName.CacheControl.toLowerCase()],
    ).toContain("no-store");

    const page = await contact.newPage();
    await page.goto(portalPathFor("de", fixture.hoursCustomer));
    const widget = page.getByRole("region", {
      name: dashboard.widgets.serviceRequest.title,
      exact: true,
    });
    await expect(widget).toContainText(
      dashboard.widgets.serviceRequest.benefit,
    );
    await expect(page.getByText("Bald verfügbar")).toHaveCount(0);
    await widget
      .getByRole("button", { name: dashboard.widgets.serviceRequest.open })
      .click();
    const dialog = page.getByRole("dialog", {
      name: content.dialog.title,
      exact: true,
    });
    // The catalog is workspace-wide, so other released entries may be listed next to these.
    for (const title of [
      "Unterseite",
      "Stundenpaket",
      "Zusatzrunde",
      "Landingpage",
    ])
      await expect(
        dialog.getByRole("button", {
          name: new RegExp(`^${PORTAL_E2E_PREFIX} ${title}\\b`),
        }),
      ).toBeVisible();
    await expect(
      dialog.getByRole("button", {
        name: new RegExp(content.picker.customTitle),
      }),
    ).toBeVisible();
    await expect(dialog).toContainText("Unterseite für dein Projekt.");
    // The catalog carries a price internally; none of it may reach the portal.
    await expect(dialog).not.toContainText("987");
    await expect(dialog).not.toContainText("€");
    await expect(dialog).not.toContainText("E2E internal scope");

    // A catalog entry for one of two projects.
    await dialog
      .getByRole("button", {
        name: new RegExp(`^${PORTAL_E2E_PREFIX} Unterseite\\b`),
      })
      .click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("service"))
      .toBe(fixture.serviceStandard);
    await dialog.getByRole("radio", { name: /Hours Shop/ }).check();
    await dialog
      .getByRole("textbox", { name: content.form.note.label })
      .fill("Bitte bis Juni");
    await dialog.getByRole("button", { name: content.form.submit }).click();
    await expect(dialog.getByText(content.sent.title)).toBeVisible();
    await dialog.getByRole("button", { name: content.sent.mine }).click();
    const requests = dialog.getByRole("tabpanel").getByRole("listitem");
    await expect(requests).toHaveCount(1);
    await expect(requests.first()).toContainText("Unterseite");
    await expect(requests.first()).toContainText(content.list.status.requested);
    await expect(requests.first()).toContainText("Hours Shop");
    await expect(requests.first()).toContainText("Bitte bis Juni");

    // Free text with a new venture, opened by a direct link.
    await page.goto(
      `${portalPathFor("de", fixture.hoursCustomer)}${DIALOG}&${PortalDashboardQueryParam.Service}=${PORTAL_SERVICE_REQUEST_CUSTOM}`,
    );
    await dialog
      .getByRole("textbox", { name: content.form.title.label })
      .fill("Zweite Landingpage");
    await dialog.getByRole("radio", { name: content.form.project.new }).check();
    await dialog.getByRole("button", { name: content.form.submit }).click();
    await expect(
      dialog.getByText(content.form.description.required),
    ).toBeVisible();
    await dialog
      .getByRole("textbox", { name: content.form.description.label })
      .fill("Für unser Sommerangebot");
    await dialog.getByRole("button", { name: content.form.submit }).click();
    await expect(dialog.getByText(content.sent.title)).toBeVisible();

    // Hours by quick choice.
    const documentRequests: string[] = [];
    page.on("request", (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame())
        documentRequests.push(request.url());
    });
    await dialog.getByRole("button", { name: content.sent.another }).click();
    await dialog
      .getByRole("button", {
        name: new RegExp(`^${PORTAL_E2E_PREFIX} Stundenpaket\\b`),
      })
      .click();
    await dialog.getByRole("button", { name: "5 Stunden" }).click();
    // Hours belong to the company: they can be requested without naming a project.
    await dialog
      .getByRole("radio", { name: content.form.project.noProject })
      .check();
    await dialog.getByRole("button", { name: content.form.submit }).click();
    await expect(dialog.getByText(content.sent.title)).toBeVisible();
    await dialog.getByRole("button", { name: content.sent.mine }).click();
    await expect(requests).toHaveCount(3);
    await expect(requests.first()).toContainText("5:00");
    // Refreshing the previous request must never reload the next form or abort its submission.
    expect(documentRequests).toHaveLength(0);

    for (const theme of ["dark", "light"] as const) {
      await page.emulateMedia({ colorScheme: theme });
      await page.screenshot({
        path: testInfo.outputPath(`portal-services-requests-${theme}.png`),
        fullPage: true,
      });
    }

    // Withdrawing asks first and then shows the new status.
    await requests
      .filter({ hasText: "Zweite Landingpage" })
      .getByRole("button", { name: /zurückziehen/i })
      .click();
    await page
      .getByRole("button", { name: content.list.confirm.confirm })
      .click();
    await expect(
      requests.filter({ hasText: "Zweite Landingpage" }),
    ).toContainText(content.list.status.withdrawn);
    await expect(
      requests
        .filter({ hasText: "Zweite Landingpage" })
        .getByRole("button", { name: /zurückziehen/i }),
    ).toHaveCount(0);

    // The card on the dashboard counts what is still in progress.
    await page.goto(portalPathFor("de", fixture.hoursCustomer));
    await expect(widget).toContainText("2 Anfragen in Bearbeitung");

    // The contact of the other company sees the catalog but none of these requests.
    const otherPage = await other.newPage();
    await otherPage.goto(
      `${portalPathFor("de", fixture.hoursOtherCustomer)}${DIALOG}`,
    );
    const otherDialog = otherPage.getByRole("dialog", {
      name: content.dialog.title,
      exact: true,
    });
    await otherDialog.getByRole("tab", { name: /Meine Anfragen/ }).click();
    await expect(otherDialog.getByText(content.list.empty)).toBeVisible();
    await expect(otherDialog).not.toContainText("Zweite Landingpage");

    // Without the read right there is neither card nor dialog.
    await otherPage.goto(
      `${portalPathFor("de", fixture.hoursCustomer)}${DIALOG}`,
    );
    await expect(otherPage.getByRole("dialog")).toHaveCount(0);
    await expect(
      otherPage.getByRole("region", {
        name: dashboard.widgets.serviceRequest.title,
        exact: true,
      }),
    ).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(
      `${portalPathFor("de", fixture.hoursCustomer)}${DIALOG}&${PortalDashboardQueryParam.Service}=${fixture.serviceHours}`,
    );
    await expect(
      dialog.getByRole("heading", { name: /Stundenpaket/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
    await page.screenshot({
      path: testInfo.outputPath("portal-services-form-mobile.png"),
      fullPage: true,
    });
  } finally {
    await contact.close();
    await other.close();
    await anonymous.close();
  }
});
