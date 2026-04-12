import { describe, expect, it, vi } from "vitest";
import type { PreparedLeadRecord } from "@/server/db/records/contact/prepared-lead-record";
import type { PreparedLeadSubmissionRecord } from "@/server/db/records/contact/prepared-lead-submission-record";

vi.mock("server-only", () => ({}));

describe("buildSharedLeadSubmission", () => {
  it("builds the shared lead and submission SQL block with params", async () => {
    const { buildSharedLeadSubmission } =
      await import("@/server/db/contact/shared/shared-lead-submission");

    const lead: PreparedLeadRecord = {
      createdAt: new Date("2026-03-26T09:30:00.000Z"),
      email: "max@example.com",
      firstName: "Max",
      id: "lead-api-id",
      lastName: "Mustermann",
      leadStatus: "new",
      updatedAt: new Date("2026-03-26T09:30:00.000Z"),
    };

    const submission: PreparedLeadSubmissionRecord = {
      channel: "project_request",
      consentAcceptedAt: new Date("2026-03-26T09:30:00.000Z"),
      createdAt: new Date("2026-03-26T09:30:00.000Z"),
      id: "submission-api-id",
      locale: "de",
      requestId: "request_123",
      submissionStartedAt: new Date("2026-03-26T09:00:00.000Z"),
      updatedAt: new Date("2026-03-26T09:30:00.000Z"),
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
