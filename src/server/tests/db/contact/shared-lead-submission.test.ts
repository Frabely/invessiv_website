import { describe, expect, it, vi } from "vitest";
import type { LeadRecord } from "@/server/db/records/contact/lead-record";
import type { LeadSubmissionRecord } from "@/server/db/records/contact/lead-submission-record";

vi.mock("server-only", () => ({}));

function createTxMock(existingLeadId?: string) {
  const executeMock = vi.fn().mockResolvedValue({
    rows: [{ id: existingLeadId ?? "lead-api-id" }],
  });
  const insertValuesMock = vi.fn().mockResolvedValue(undefined);
  const insertMock = vi.fn().mockReturnValue({
    values: insertValuesMock,
  });

  return {
    tx: {
      execute: executeMock,
      insert: insertMock,
    },
    mocks: {
      executeMock,
      insertMock,
      insertValuesMock,
    },
  };
}

describe("persistSharedLeadSubmission", () => {
  it("runs one atomic lead upsert and reuses its returned id for the submission", async () => {
    const { persistSharedLeadSubmission } =
      await import("@/server/db/contact/shared/shared-lead-submission");

    const lead: LeadRecord = {
      created_at: new Date("2026-03-26T09:30:00.000Z"),
      email: "max@example.com",
      first_name: "Max",
      id: "lead-api-id",
      last_name: "Mustermann",
      lead_status: "new",
      owner: undefined,
      updated_at: new Date("2026-03-26T09:30:00.000Z"),
    };

    const submission: LeadSubmissionRecord = {
      channel: "project_request",
      consent_accepted_at: new Date("2026-03-26T09:30:00.000Z"),
      created_at: new Date("2026-03-26T09:30:00.000Z"),
      id: "submission-api-id",
      lead_id: "lead-api-id",
      locale: "de",
      request_id: "request_123",
      submission_started_at: new Date("2026-03-26T09:00:00.000Z"),
      updated_at: new Date("2026-03-26T09:30:00.000Z"),
    };

    const { tx, mocks } = createTxMock();

    const result = await persistSharedLeadSubmission(tx as never, {
      lead,
      submission,
    });

    expect(result).toEqual({
      leadId: "lead-api-id",
      submissionId: "submission-api-id",
    });
    expect(mocks.executeMock).toHaveBeenCalledTimes(1);
    expect(mocks.insertMock).toHaveBeenCalledTimes(1);
    expect(mocks.insertValuesMock).toHaveBeenCalledWith({
      channel: "project_request",
      consent_accepted_at: new Date("2026-03-26T09:30:00.000Z"),
      created_at: new Date("2026-03-26T09:30:00.000Z"),
      id: "submission-api-id",
      lead_id: "lead-api-id",
      locale: "de",
      request_id: "request_123",
      submission_started_at: new Date("2026-03-26T09:00:00.000Z"),
      updated_at: new Date("2026-03-26T09:30:00.000Z"),
    });
  });

  it("uses the id returned from the atomic upsert for an existing normalized email", async () => {
    const { persistSharedLeadSubmission } =
      await import("@/server/db/contact/shared/shared-lead-submission");

    const { tx, mocks } = createTxMock("existing-lead-id");

    const result = await persistSharedLeadSubmission(tx as never, {
      lead: {
        created_at: new Date("2026-03-26T09:30:00.000Z"),
        email: "max@example.com",
        first_name: "Max",
        id: "new-lead-id",
        last_name: "Mustermann",
        lead_status: "new",
        owner: undefined,
        updated_at: new Date("2026-03-26T09:35:00.000Z"),
      },
      submission: {
        channel: "quick_contact",
        consent_accepted_at: new Date("2026-03-26T09:35:00.000Z"),
        created_at: new Date("2026-03-26T09:35:00.000Z"),
        id: "submission-api-id",
        lead_id: "new-lead-id",
        locale: "de",
        request_id: "request_123",
        submission_started_at: undefined,
        updated_at: new Date("2026-03-26T09:35:00.000Z"),
      },
    });

    expect(result).toEqual({
      leadId: "existing-lead-id",
      submissionId: "submission-api-id",
    });
    expect(mocks.executeMock).toHaveBeenCalledTimes(1);
    expect(mocks.insertMock).toHaveBeenCalledTimes(1);
    expect(mocks.insertValuesMock).toHaveBeenCalledWith({
      channel: "quick_contact",
      consent_accepted_at: new Date("2026-03-26T09:35:00.000Z"),
      created_at: new Date("2026-03-26T09:35:00.000Z"),
      id: "submission-api-id",
      lead_id: "existing-lead-id",
      locale: "de",
      request_id: "request_123",
      submission_started_at: null,
      updated_at: new Date("2026-03-26T09:35:00.000Z"),
    });
  });
});
