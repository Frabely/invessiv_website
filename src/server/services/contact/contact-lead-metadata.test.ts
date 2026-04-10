import { describe, expect, it, vi } from "vitest";
import {
  calculateLeadRetentionUntil,
  createContactLeadSubmission,
} from "@/server/services/contact/contact-lead-metadata";

vi.mock("server-only", () => ({}));

describe("contact lead metadata", () => {
  it("calculates the default 24-month retention window", () => {
    const retentionUntil = calculateLeadRetentionUntil(
      new Date("2026-03-26T09:30:00.000Z"),
    );

    expect(retentionUntil.toISOString()).toBe("2028-03-26T09:30:00.000Z");
  });

  it("maps a validated contact payload into lead and project request records", () => {
    const submission = createContactLeadSubmission(
      {
        budgetKey: "between_2500_5000",
        company: "Invessiv GmbH",
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        goalKey: "generate_inquiries",
        kind: "project_request",
        lastName: "Mustermann",
        locale: "de",
        offerKey: "landing",
        pagesCustom: "Karriereseite",
        pageKeys: ["home", "contact"],
        phone: "+49 151 23456789",
        preferredStartKey: "within_two_weeks",
        projectDetails: "Eine Landingpage für qualifizierte Leads.",
        role: "Founder",
        startedAt: "2026-03-26T09:00:00.000Z",
        website: "https://example.com",
        workflowKey: undefined,
      },
      "request_123",
      "resend",
      new Date("2026-03-26T09:30:00.000Z"),
    );

    expect(submission.lead.requestId).toBe("request_123");
    expect(submission.lead.sourceForm).toBe("project_request");
    expect(submission.lead.mailProvider).toBe("resend");
    expect(submission.lead.mailStatus).toBe("pending");
    expect(submission.lead.privacyVersion).toBe("2026-03-26");
    expect(submission.lead.termsVersion).toBe("2026-03-26");
    expect(submission.projectRequest.leadId).toBe(submission.lead.id);
    expect(submission.projectRequest.pageKeys).toEqual(["home", "contact"]);
    expect(submission.lead.retentionUntil).toBe("2028-03-26T09:30:00.000Z");
  });

  it("stores the actual configured mail provider metadata", () => {
    const submission = createContactLeadSubmission(
      {
        budgetKey: undefined,
        company: undefined,
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        goalKey: undefined,
        kind: "project_request",
        lastName: "Mustermann",
        locale: "de",
        offerKey: "landing",
        pagesCustom: undefined,
        pageKeys: undefined,
        phone: undefined,
        preferredStartKey: undefined,
        projectDetails: "Test",
        role: undefined,
        startedAt: "2026-03-26T09:00:00.000Z",
        website: undefined,
        websiteTrap: undefined,
        workflowKey: undefined,
      },
      "request_456",
      "disabled",
      new Date("2026-03-26T09:30:00.000Z"),
    );

    expect(submission.lead.mailProvider).toBe("disabled");
  });
});
