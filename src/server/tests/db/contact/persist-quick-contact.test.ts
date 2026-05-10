import { describe, expect, it, vi } from "vitest";
import { LeadSource } from "@/common/constants/leads/sources/lead-sources";

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
vi.mock("@/server/db/core", () => ({
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
  hasDatabaseConnectionString: hasDatabaseConnectionStringMock,
}));
vi.mock("@/server/db/contact/shared/shared-lead-submission", () => ({
  persistSharedLeadSubmission: persistSharedLeadSubmissionMock,
}));

describe("persistQuickContactLead", () => {
  it("runs the shared submission flow and inserts the email contact in one transaction", async () => {
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

    const { persistQuickContactLead } =
      await import("@/server/db/contact/persist-quick-contact");

    const result = await persistQuickContactLead({
      lead_email_contact: {
        created_at: new Date("2026-03-26T09:30:00.000Z"),
        id: "email-contact-id",
        lead_submission_id: "submission-id",
        message: "Kurze erste Anfrage.",
        updated_at: new Date("2026-03-26T09:30:00.000Z"),
      },
      lead: {
        created_at: new Date("2026-03-26T09:30:00.000Z"),
        email: "max@example.com",
        first_name: "Max",
        id: "lead-api-id",
        last_name: "Mustermann",
        lead_status: "new",
        owner: undefined,
        source: LeadSource.Webform,
        updated_at: new Date("2026-03-26T09:30:00.000Z"),
      },
      lead_submission: {
        channel: "quick_contact",
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
        channel: "quick_contact",
        id: "submission-id",
      }),
    });
    expect(valuesMock).toHaveBeenCalledWith({
      created_at: new Date("2026-03-26T09:30:00.000Z"),
      id: "email-contact-id",
      lead_submission_id: "submission-id",
      message: "Kurze erste Anfrage.",
      updated_at: new Date("2026-03-26T09:30:00.000Z"),
    });
  });
});
