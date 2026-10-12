import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { and, eq, inArray } from "drizzle-orm";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  serviceRequests,
  lineItemTemplates,
} from "@invessiv/db/record-configuration";
import { crmServiceRequestStatusEndpoint } from "@/common/patterns/crm/crm-api-endpoints";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import {
  crmServiceRequestsPathFor,
  workspaceAreaPathFor,
} from "@/lib/auth/routes";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { THEME_STORAGE_KEY } from "@/lib/theme/theme";
import de from "@/i18n/dictionaries/workspace/crm/service-requests/de.json";
import en from "@/i18n/dictionaries/workspace/crm/service-requests/en.json";
import {
  portalE2ePaths,
  type PortalE2eFixture,
} from "./support/portal-e2e-fixture";

test.use({ storageState: portalE2ePaths.managerState });

/** The row of one request inside the cockpit section; the title alone also appears as a project service. */
function requestRow(page: Page, sectionTitle: string, name: string): Locator {
  return page
    .getByRole("region", { name: sectionTitle, exact: true })
    .getByRole("listitem")
    .filter({ has: page.getByText(name, { exact: true }) });
}

test("offers, declines with a conflict, and assigns a request in the customer cockpit", async ({
  page,
}, testInfo) => {
  const fixture = JSON.parse(
    await readFile(portalE2ePaths.fixture, "utf8"),
  ) as PortalE2eFixture;
  const db = getDrizzleDatabaseClient();
  const templateId = randomUUID();
  const acceptedId = randomUUID();
  const declinedId = randomUUID();
  const title = "E2E service request " + randomUUID();
  const declineTitle = "E2E declined service " + randomUUID();
  await db.insert(lineItemTemplates).values({
    id: templateId,
    title,
    description: "Synthetic service scope",
    price_cents: 12500,
    pricing_mode: ServicePricingMode.OneTime,
    recurring_interval: null,
    status: LineItemTemplateStatus.Active,
    kind: LineItemKind.Standard,
    project_mode: LineItemProjectMode.ExistingProject,
    portal_requestable: false,
    portal_description: "",
    version: 1,
  });
  await db.insert(serviceRequests).values(
    [acceptedId, declinedId].map((id, i) => ({
      id,
      customer_id: fixture.credentialsCustomer,
      line_item_template_id: templateId,
      requested_by_membership_id: fixture.credentialsMembership,
      kind: LineItemKind.Standard,
      title: i ? declineTitle : title,
      note: "<b>Synthetic customer text</b>",
      project_wish: ServiceRequestProjectWish.Existing,
      requested_project_id: fixture.credentialsProject,
      status: S.Requested,
      idempotency_key: id,
      version: 1,
    })),
  );
  try {
    // One batched capture pass covers both locales, themes and device classes.
    for (const variant of [
      { locale: "de", content: de, theme: "dark", width: 1440, height: 1000 },
      { locale: "en", content: en, theme: "light", width: 390, height: 844 },
    ] as const) {
      await page.setViewportSize({
        width: variant.width,
        height: variant.height,
      });
      await page.addInitScript(
        ({ key, theme }) => localStorage.setItem(key, theme),
        { key: THEME_STORAGE_KEY, theme: variant.theme },
      );
      await page.goto(crmServiceRequestsPathFor(variant.locale));
      const inboxLink = page.getByRole("link", {
        name: formatMessage(variant.content.table.openNamed, { name: title }),
        exact: true,
      });
      await expect(inboxLink).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        variant.theme,
      );
      await inboxLink.click();
      const card = requestRow(page, variant.content.section.title, title);
      await expect(card).toHaveAttribute("data-selected", "true");
      await expect(
        card.getByText("<b>Synthetic customer text</b>"),
      ).toBeVisible();
      await card
        .getByRole("link", {
          name: variant.content.actions.acceptWithoutOffer,
          exact: true,
        })
        .click();
      const dialog = page.getByRole("dialog", {
        name: variant.content.form.acceptWithoutOfferTitle,
        exact: true,
      });
      // Accepting before an offer stays locked until it is confirmed on purpose.
      await expect(
        dialog.getByRole("button", {
          name: variant.content.form.accept,
          exact: true,
        }),
      ).toBeDisabled();
      await expect(
        dialog.getByText(variant.content.form.project, { exact: true }).first(),
      ).toBeVisible();
      expect(
        await dialog.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(
          "service-request-" + variant.locale + "-" + variant.theme + ".png",
        ),
        fullPage: true,
        animations: "disabled",
      });
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    const crmPath = workspaceAreaPathFor("de", WorkspaceArea.Crm);
    await page.goto(
      buildCustomerCockpitHref(crmPath, fixture.credentialsCustomer, "", {
        serviceRequestId: acceptedId,
      }),
    );
    const card = requestRow(page, de.section.title, title);
    const offer = page.waitForResponse(
      (r) =>
        r.url().endsWith("/" + acceptedId + "/status") &&
        r.request().method() === "PATCH",
    );
    await card
      .getByRole("button", { name: de.actions.offered, exact: true })
      .click();
    expect((await offer).status()).toBe(200);
    await expect(
      card.getByText(de.status.offered, { exact: true }),
    ).toBeVisible();
    await card
      .getByRole("link", { name: de.actions.accept, exact: true })
      .click();
    const accept = page.getByRole("dialog", {
      name: de.form.acceptTitle,
      exact: true,
    });
    await accept
      .getByRole("button", { name: de.form.accept, exact: true })
      .click();
    await expect(accept).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: de.details.project, exact: true }),
    ).toBeVisible();
    const [accepted] = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, acceptedId));
    expect(accepted).toMatchObject({
      status: S.Accepted,
      project_id: fixture.credentialsProject,
      project_line_item_id: expect.any(String),
    });

    await page.goto(
      buildCustomerCockpitHref(crmPath, fixture.credentialsCustomer, "", {
        serviceRequestId: declinedId,
      }),
    );
    await requestRow(page, de.section.title, declineTitle)
      .getByRole("link", { name: de.actions.decline })
      .click();
    const decline = page.getByRole("dialog", {
      name: de.form.declineTitle,
      exact: true,
    });
    await decline.getByRole("button", { name: de.form.decline }).click();
    await expect(decline.getByText(de.form.reasonRequired)).toBeVisible();
    const reason = "Dieses Vorhaben passt derzeit nicht in unseren Zeitplan.";
    await decline
      .getByRole("textbox", { name: /Ablehnungsgrund/ })
      .fill(reason);
    // A second authenticated writer changes the row while the first dialog remains open.
    expect(
      (
        await page.request.patch(crmServiceRequestStatusEndpoint(declinedId), {
          data: { to: S.Offered, version: 1 },
        })
      ).status(),
    ).toBe(200);
    await decline.getByRole("button", { name: de.form.decline }).click();
    await expect(decline.getByText(de.form.conflict)).toBeVisible();
    await expect(decline.getByRole("textbox")).toHaveValue(reason);
    await decline.getByRole("button", { name: de.form.decline }).click();
    await expect(decline).not.toBeVisible();
    const [declined] = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, declinedId));
    expect(declined).toMatchObject({
      status: S.Declined,
      decline_reason: reason,
      version: 3,
    });
    const foreignHref = buildCustomerCockpitHref(
      crmPath,
      fixture.filesCustomer,
      "",
      { serviceRequestId: acceptedId },
    );
    await page.goto(foreignHref + "&serviceRequestAction=accept");
    await expect(
      page.getByRole("dialog", { name: de.form.acceptTitle, exact: true }),
    ).not.toBeVisible();
  } finally {
    await db
      .delete(serviceRequests)
      .where(
        and(
          eq(serviceRequests.customer_id, fixture.credentialsCustomer),
          inArray(serviceRequests.id, [acceptedId, declinedId]),
        ),
      );
    await db
      .delete(lineItemTemplates)
      .where(eq(lineItemTemplates.id, templateId));
  }
});
