import { describe, expect, it, vi } from "vitest";
import { LeadSource } from "@invessiv/common/constants/leads/sources/lead-sources";

const {
  getDrizzleDatabaseClientMock,
  hasDatabaseConnectionStringMock,
  persistSharedLeadSubmissionMock,
} = vi.hoisted(() => ({
  getDrizzleDatabaseClientMock: vi.fn(),
  hasDatabaseConnectionStringMock: vi.fn(),
  persistSharedLeadSubmissionMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
  hasDatabaseConnectionString: hasDatabaseConnectionStringMock,
}));
vi.mock("@invessiv/db/contact/shared/shared-lead-submission", () => ({
  persistSharedLeadSubmission: persistSharedLeadSubmissionMock,
}));

describe("persistProjectRequestLead", () => {
  it("runs the shared submission flow and inserts the project request in one transaction", async () => {
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    const tx = {
      insert: vi.fn().mockReturnValue({
        values: valuesMock,
      }),
    };
    const transactionMock = vi.fn().mockImplementation(async (callback) => {
      await callback(tx);
    });
    getDrizzleDatabaseClientMock.mockReturnValue({
      transaction: transactionMock,
    });
    hasDatabaseConnectionStringMock.mockReturnValue(true);
    persistSharedLeadSubmissionMock.mockResolvedValue({
      leadId: "lead-api-id",
      submissionId: "submission-id",
    });

    const { persistProjectRequestLead } =
      await import("@invessiv/db/contact/persist-project-request");

    const result = await persistProjectRequestLead({
      lead: {
        created_at: new Date("2026-03-26T09:30:00.000Z"),
        display_name: "Max Mustermann",
        email: "max@example.com",
        first_name: "Max",
        id: "lead-api-id",
        last_name: "Mustermann",
        lead_status: "new",
        owner: undefined,
        source: LeadSource.Webform,
        updated_at: new Date("2026-03-26T09:30:00.000Z"),
      },
      lead_project_request: {
        budget_key: "between_2500_5000",
        company: "Invessiv GmbH",
        created_at: new Date("2026-03-26T09:30:00.000Z"),
        custom_page_names: ["Karriereseite"],
        goal_key: "generate_inquiries",
        id: "project-request-id",
        lead_submission_id: "submission-id",
        offer_key: "landing",
        page_keys: ["home", "contact"],
        phone: "+49 151 23456789",
        preferred_start_key: "within_two_weeks",
        project_details: "Eine Landingpage fuer qualifizierte Leads.",
        role: "Founder",
        updated_at: new Date("2026-03-26T09:30:00.000Z"),
        website: "https://example.com",
        workflow_key: undefined,
      },
      lead_submission: {
        channel: "project_request",
        consent_accepted_at: new Date("2026-03-26T09:30:00.000Z"),
        created_at: new Date("2026-03-26T09:30:00.000Z"),
        id: "submission-id",
        lead_id: "lead-api-id",
        locale: "de",
        request_id: "request_123",
        submission_started_at: new Date("2026-03-26T09:00:00.000Z"),
        updated_at: new Date("2026-03-26T09:30:00.000Z"),
      },
    });

    expect(result).toEqual({
      persisted: true,
      submissionId: "submission-id",
    });
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(persistSharedLeadSubmissionMock).toHaveBeenCalledWith(tx, {
      lead: expect.objectContaining({
        email: "max@example.com",
        id: "lead-api-id",
      }),
      submission: expect.objectContaining({
        channel: "project_request",
        id: "submission-id",
      }),
    });
    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(valuesMock).toHaveBeenCalledWith({
      budget_key: "between_2500_5000",
      company: "Invessiv GmbH",
      created_at: new Date("2026-03-26T09:30:00.000Z"),
      custom_page_names: ["Karriereseite"],
      goal_key: "generate_inquiries",
      id: "project-request-id",
      lead_submission_id: "submission-id",
      offer_key: "landing",
      page_keys: ["home", "contact"],
      phone: "+49 151 23456789",
      preferred_start_key: "within_two_weeks",
      project_details: "Eine Landingpage fuer qualifizierte Leads.",
      role: "Founder",
      updated_at: new Date("2026-03-26T09:30:00.000Z"),
      website: "https://example.com",
      workflow_key: undefined,
    });
  });
});
