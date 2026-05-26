import { describe, expect, it } from "vitest";
import { CONTACT_BUDGET_KEY } from "@invessiv/common/constants/contact/contact-budget-keys";
import { CONTACT_GOAL_KEY } from "@invessiv/common/constants/contact/contact-goal-keys";
import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";
import { CONTACT_PAGE_KEY } from "@invessiv/common/constants/contact/contact-page-keys";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import { CONTACT_START_KEY } from "@invessiv/common/constants/contact/contact-start-keys";
import { CONTACT_WORKFLOW_KEY } from "@invessiv/common/constants/contact/contact-workflow-keys";
import { projectRequestSchema } from "./project-request.schema";

const basePayload = {
  consentAccepted: true,
  email: "max@example.com",
  displayName: "Max Mustermann",
  kind: CONTACT_REQUEST_KIND.ProjectRequest,
  locale: "de",
  projectDetails:
    "Eine Projektanfrage mit ausreichend Kontext fuer die erste Einschaetzung.",
  startedAt: "2026-03-20T10:00:00.000Z",
};

describe("projectRequestSchema", () => {
  it.each([
    [
      CONTACT_OFFER_KEY.Landing,
      {
        goalKey: CONTACT_GOAL_KEY.GenerateInquiries,
      },
    ],
    [
      CONTACT_OFFER_KEY.Web,
      {
        pageKeys: [CONTACT_PAGE_KEY.Home],
      },
    ],
    [
      CONTACT_OFFER_KEY.Upgrade,
      {
        website: "https://example.com",
      },
    ],
    [
      CONTACT_OFFER_KEY.Process,
      {
        workflowKey: CONTACT_WORKFLOW_KEY.SimplifyManualProcess,
      },
    ],
    [
      CONTACT_OFFER_KEY.Maintenance,
      {
        website: "https://example.com",
      },
    ],
  ])("keeps %s valid with its existing required fields", (offerKey, fields) => {
    const result = projectRequestSchema.safeParse({
      ...basePayload,
      ...fields,
      offerKey,
    });

    expect(result.success).toBe(true);
  });

  it("accepts the new web offer selection via landing with web-specific fields", () => {
    const result = projectRequestSchema.safeParse({
      ...basePayload,
      budgetKey: CONTACT_BUDGET_KEY.Between2500And5000,
      goalKey: CONTACT_GOAL_KEY.GenerateInquiries,
      offerKey: CONTACT_OFFER_KEY.Landing,
      pageKeys: [CONTACT_PAGE_KEY.Home, CONTACT_PAGE_KEY.Contact],
      preferredStartKey: CONTACT_START_KEY.WithinOneMonth,
      website: "https://example.com",
    });

    expect(result.success).toBe(true);
  });

  it("accepts early web requests without a page idea", () => {
    const result = projectRequestSchema.safeParse({
      ...basePayload,
      goalKey: CONTACT_GOAL_KEY.GenerateInquiries,
      offerKey: CONTACT_OFFER_KEY.Landing,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid legacy web payloads without pages", () => {
    const result = projectRequestSchema.safeParse({
      ...basePayload,
      offerKey: CONTACT_OFFER_KEY.Web,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.pageKeys).toContain(
      "pages_required",
    );
  });
});
