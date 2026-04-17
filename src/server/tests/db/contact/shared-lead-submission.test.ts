import { describe, expect, it, vi } from "vitest";
import type { LeadRecord } from "@/server/db/records/contact/lead-record";
import type { LeadSubmissionRecord } from "@/server/db/records/contact/lead-submission-record";

vi.mock("server-only", () => ({}));

function createTxMock(existingLeadId?: string) {
  const limitMock = vi
    .fn()
    .mockResolvedValue(existingLeadId ? [{ id: existingLeadId }] : []);
  const whereSelectMock = vi.fn().mockReturnValue({
    limit: limitMock,
  });
  const fromMock = vi.fn().mockReturnValue({
    where: whereSelectMock,
  });
  const selectMock = vi.fn().mockReturnValue({
    from: fromMock,
  });

  const insertValuesMock = vi.fn().mockResolvedValue(undefined);
  const insertMock = vi.fn().mockReturnValue({
    values: insertValuesMock,
  });

  const updateWhereMock = vi.fn().mockResolvedValue(undefined);
  const updateSetMock = vi.fn().mockReturnValue({
    where: updateWhereMock,
  });
  const updateMock = vi.fn().mockReturnValue({
    set: updateSetMock,
  });

  return {
    tx: {
      insert: insertMock,
      select: selectMock,
      update: updateMock,
    },
    mocks: {
      insertMock,
      insertValuesMock,
      limitMock,
      selectMock,
      updateMock,
      updateSetMock,
      updateWhereMock,
    },
  };
}

describe("persistSharedLeadSubmission", () => {
  it("inserts lead and submission when no lead exists for the normalized email", async () => {
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
    expect(mocks.selectMock).toHaveBeenCalledTimes(1);
    expect(mocks.updateMock).not.toHaveBeenCalled();
    expect(mocks.insertMock).toHaveBeenCalledTimes(2);
    expect(mocks.insertValuesMock).toHaveBeenNthCalledWith(1, {
      created_at: new Date("2026-03-26T09:30:00.000Z"),
      email: "max@example.com",
      first_name: "Max",
      id: "lead-api-id",
      last_name: "Mustermann",
      lead_status: "new",
      updated_at: new Date("2026-03-26T09:30:00.000Z"),
    });
    expect(mocks.insertValuesMock).toHaveBeenNthCalledWith(2, {
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

  it("updates the existing lead and reuses its id for the submission", async () => {
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
    expect(mocks.updateMock).toHaveBeenCalledTimes(1);
    expect(mocks.updateSetMock).toHaveBeenCalledWith({
      email: "max@example.com",
      first_name: "Max",
      last_name: "Mustermann",
      updated_at: new Date("2026-03-26T09:35:00.000Z"),
    });
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
