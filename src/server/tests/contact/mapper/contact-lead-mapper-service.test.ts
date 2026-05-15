import { describe, expect, it, vi } from "vitest";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { LeadSource } from "@/common/constants/leads/sources/lead-sources";

const { randomUUIDMock } = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("node:crypto", () => ({
  randomUUID: randomUUIDMock,
}));

describe("leadMapperService", () => {
  it("maps the lead api payload to db and sets the pending_review default lead status", async () => {
    randomUUIDMock.mockReturnValueOnce("lead-id-1");

    const { leadMapperService } =
      await import("@/server/contact/mapper/contact-lead-mapper-service");

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const result = leadMapperService.mapLeadApiToDb(
      {
        email: " max@example.com ",
        displayName: " Max Mustermann ",
        website_url: "https://example.com ",
      },
      createdAt,
    );

    expect(result).toEqual({
      created_at: createdAt,
      display_name: "Max Mustermann",
      email: "max@example.com",
      id: "lead-id-1",
      first_name: undefined,
      last_name: undefined,
      lead_status: ContactLeadStatus.PendingReview,
      owner: undefined,
      source: LeadSource.Webform,
      website_url: "https://example.com",
      updated_at: createdAt,
    });
  });

  it("creates linked lead, submission, and email contact records for quick contact", async () => {
    randomUUIDMock
      .mockReturnValueOnce("lead-id-1")
      .mockReturnValueOnce("submission-id-1")
      .mockReturnValueOnce("email-contact-id-1");

    const { leadMapperService } =
      await import("@/server/contact/mapper/contact-lead-mapper-service");

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const result = leadMapperService.mapQuickContactDtoToDbPersistInput(
      {
        consentAccepted: true,
        email: "max@example.com",
        displayName: "Max Mustermann",
        kind: "quick_contact",
        locale: "de",
        message: "Kurze erste Anfrage.",
      },
      { requestId: "request_456", createdAt },
    );

    expect(result.lead.id).toBe("lead-id-1");
    expect(result.lead.lead_status).toBe(ContactLeadStatus.PendingReview);
    expect(result.lead_submission.id).toBe("submission-id-1");
    expect(result.lead_submission.lead_id).toBe(result.lead.id);
    expect(result.lead_email_contact.id).toBe("email-contact-id-1");
    expect(result.lead_email_contact.lead_submission_id).toBe(
      result.lead_submission.id,
    );
    expect(result.lead_email_contact.message).toBe("Kurze erste Anfrage.");
  });

  it("creates linked lead, submission, and project request records", async () => {
    randomUUIDMock
      .mockReturnValueOnce("lead-id-1")
      .mockReturnValueOnce("submission-id-1")
      .mockReturnValueOnce("project-request-id-1");

    const { leadMapperService } =
      await import("@/server/contact/mapper/contact-lead-mapper-service");

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const result = leadMapperService.mapProjectRequestDtoToDbPersistInput(
      {
        budgetKey: "between_2500_5000",
        company: "Invessiv GmbH",
        consentAccepted: true,
        email: "max@example.com",
        displayName: "Max Mustermann",
        goalKey: "generate_inquiries",
        kind: "project_request",
        locale: "de",
        offerKey: "landing",
        customPageNames: ["Karriereseite"],
        pageKeys: ["home", "contact"],
        phone: "+49 151 23456789",
        preferredStartKey: "within_two_weeks",
        projectDetails: "Eine Landingpage fuer qualifizierte Leads.",
        role: "Founder",
        startedAt: "2026-03-26T09:00:00.000Z",
        website: "https://example.com",
        workflowKey: undefined,
      },
      { requestId: "request_123", createdAt },
    );

    expect(result.lead.id).toBe("lead-id-1");
    expect(result.lead.lead_status).toBe(ContactLeadStatus.PendingReview);
    expect(result.lead.owner).toBeUndefined();
    expect(result.lead_submission.id).toBe("submission-id-1");
    expect(result.lead_submission.lead_id).toBe(result.lead.id);
    expect(result.lead_project_request.id).toBe("project-request-id-1");
    expect(result.lead_project_request.lead_submission_id).toBe(
      result.lead_submission.id,
    );
    expect(result.lead_project_request.page_keys).toEqual(["home", "contact"]);
    expect(result.lead_project_request.custom_page_names).toEqual([
      "Karriereseite",
    ]);
    expect(result.lead.website_url).toBe("https://example.com");
  });

  it("creates linked lead, submission, and call contact records", async () => {
    randomUUIDMock
      .mockReturnValueOnce("lead-id-1")
      .mockReturnValueOnce("submission-id-1")
      .mockReturnValueOnce("call-contact-id-1");

    const { leadMapperService } =
      await import("@/server/contact/mapper/contact-lead-mapper-service");

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const result = leadMapperService.mapDiscoveryCallDtoToDbPersistInput(
      {
        consentAccepted: true,
        email: "max@example.com",
        displayName: "Max Mustermann",
        kind: "discovery_call",
        locale: "de",
        message: "Wir wollen den Umfang kurz einordnen.",
      },
      { requestId: "request_789", createdAt },
    );

    expect(result.lead.id).toBe("lead-id-1");
    expect(result.lead.lead_status).toBe(ContactLeadStatus.PendingReview);
    expect(result.lead_submission.id).toBe("submission-id-1");
    expect(result.lead_submission.lead_id).toBe(result.lead.id);
    expect(result.call_contact.id).toBe("call-contact-id-1");
    expect(result.call_contact.lead_submission_id).toBe(
      result.lead_submission.id,
    );
    expect(result.call_contact.message).toBe(
      "Wir wollen den Umfang kurz einordnen.",
    );
  });

  it("maps submission metadata and keeps the started-at timestamp", async () => {
    randomUUIDMock.mockReturnValueOnce("submission-id-1");

    const { leadMapperService } =
      await import("@/server/contact/mapper/contact-lead-mapper-service");

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const startedAt = new Date("2026-03-26T09:00:00.000Z");
    const result = leadMapperService.mapSubmissionApiToDb(
      {
        locale: "de",
        startedAt,
      },
      "request_123",
      "project_request",
      "lead-id-1",
      createdAt,
    );

    expect(result).toEqual({
      channel: "project_request",
      consent_accepted_at: createdAt,
      created_at: createdAt,
      id: "submission-id-1",
      lead_id: "lead-id-1",
      locale: "de",
      request_id: "request_123",
      submission_started_at: startedAt,
      updated_at: createdAt,
    });
  });
});
