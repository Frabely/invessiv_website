import { describe, expect, it, vi } from "vitest";
import { LeadSource } from "@invessiv/common/constants/leads/sources/lead-sources";
import type { ContactLeadPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-persist-record";
import type { ContactLeadSubmissionPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-submission-persist-record";

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

function serializeSqlChunks(value: unknown): string {
  const chunks = (value as { queryChunks?: unknown[] }).queryChunks ?? [];
  return chunks
    .map((chunk) => {
      if (chunk == null) {
        return "";
      }
      const maybeStringChunk = chunk as { value?: unknown };
      return Array.isArray(maybeStringChunk.value)
        ? maybeStringChunk.value.join(" ")
        : String(maybeStringChunk.value ?? chunk);
    })
    .join(" ");
}

describe("persistSharedLeadSubmission", () => {
  it("runs one atomic lead upsert and reuses its returned id for the submission", async () => {
    const { persistSharedLeadSubmission } =
      await import("@invessiv/db/contact/shared/shared-lead-submission");

    const lead: ContactLeadPersistRecord = {
      created_at: new Date("2026-03-26T09:30:00.000Z"),
      display_name: "Max Mustermann",
      email: "max@example.com",
      first_name: "Max",
      id: "lead-api-id",
      last_name: "Mustermann",
      lead_status: "new",
      company_name: "Invessiv GmbH",
      notes: "Kurze erste Anfrage.",
      owner: undefined,
      phone: "+49 151 23456789",
      website_url: "https://example.com",
      source: LeadSource.Webform,
      updated_at: new Date("2026-03-26T09:30:00.000Z"),
    };

    const submission: ContactLeadSubmissionPersistRecord = {
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
    const upsertSql = serializeSqlChunks(mocks.executeMock.mock.calls[0]?.[0]);
    expect(upsertSql).toContain("display_name");
    expect(upsertSql).toContain("display_name = excluded.display_name");
    expect(upsertSql).toContain("company_name = excluded.company_name");
    expect(upsertSql).toContain("phone");
    expect(upsertSql).toContain("phone = excluded.phone");
    expect(upsertSql).toContain("website_url");
    expect(upsertSql).toContain("website_url = excluded.website_url");
    expect(upsertSql).toContain("notes");
    expect(upsertSql).toContain("notes = excluded.notes");
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
      await import("@invessiv/db/contact/shared/shared-lead-submission");

    const { tx, mocks } = createTxMock("existing-lead-id");

    const result = await persistSharedLeadSubmission(tx as never, {
      lead: {
        created_at: new Date("2026-03-26T09:30:00.000Z"),
        display_name: "Max Mustermann",
        email: "max@example.com",
        first_name: "Max",
        id: "new-lead-id",
        last_name: "Mustermann",
        lead_status: "new",
        company_name: "Neue Firma",
        owner: undefined,
        source: LeadSource.Webform,
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

  it("throws when the lead upsert does not yield an id", async () => {
    const { persistSharedLeadSubmission } =
      await import("@invessiv/db/contact/shared/shared-lead-submission");

    const executeMock = vi.fn().mockResolvedValue({ rows: [] });
    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    const insertMock = vi.fn().mockReturnValue({
      values: insertValuesMock,
    });
    const tx = {
      execute: executeMock,
      insert: insertMock,
    };

    await expect(
      persistSharedLeadSubmission(tx as never, {
        lead: {
          company_name: null,
          created_at: new Date("2026-03-26T09:30:00.000Z"),
          display_name: "Max Mustermann",
          email: "max@example.com",
          first_name: null,
          id: "new-lead-id",
          last_name: null,
          lead_status: "new",
          phone: null,
          website_url: null,
          owner: null,
          source: LeadSource.Webform,
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
      }),
    ).rejects.toThrow("Lead upsert did not return an id.");
    expect(insertMock).not.toHaveBeenCalled();
  });
});
