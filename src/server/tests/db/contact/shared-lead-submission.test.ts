import { describe, expect, it, vi } from "vitest";
import type { LeadRecord } from "@/server/db/records/contact/lead-record";
import type { LeadSubmissionRecord } from "@/server/db/records/contact/lead-submission-record";

vi.mock("server-only", () => ({}));

describe("buildSharedLeadSubmission", () => {
  it("builds the shared lead and submission SQL block with params", async () => {
    const { buildSharedLeadSubmission } =
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

    const result = buildSharedLeadSubmission({
      lead,
      submission,
    });

    expect(result.sql).toContain("upserted_lead AS");
    expect(result.sql).toContain("INSERT INTO leads");
    expect(result.sql).toContain("inserted_submission AS");
    expect(result.sql).toContain("INSERT INTO lead_submissions");
    expect(result.sql).toContain("FROM upserted_lead");
    expect(result.submissionSource).toBe("inserted_submission");
    expect(result.params).toEqual([
      "lead-api-id",
      "Max",
      "Mustermann",
      "max@example.com",
      "new",
      new Date("2026-03-26T09:30:00.000Z"),
      new Date("2026-03-26T09:30:00.000Z"),
      "submission-api-id",
      "request_123",
      "project_request",
      "de",
      new Date("2026-03-26T09:30:00.000Z"),
      new Date("2026-03-26T09:00:00.000Z"),
      new Date("2026-03-26T09:30:00.000Z"),
      new Date("2026-03-26T09:30:00.000Z"),
    ]);
  });
});
