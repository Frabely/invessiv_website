import { describe, expect, it, vi } from "vitest";
import type { PreparedLeadSubmissionRecord } from "@/server/common/contracts/contact/prepared-lead-submission-record";

vi.mock("server-only", () => ({}));

describe("persistSubmission", () => {
  it("inserts the submission row with the provided lead id", async () => {
    const tx = vi.fn().mockResolvedValue([]);

    const { persistSubmission } = await import(
      "@/server/db/contact/submission-persistence"
    );

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

    const result = await persistSubmission(tx as never, "lead-db-id", submission);

    expect(result).toEqual({
      persisted: true,
      submissionId: "submission-api-id",
    });
    expect(tx).toHaveBeenCalledTimes(1);

    const [strings, ...values] = tx.mock.calls[0];
    expect(strings.join("")).toContain("INSERT INTO lead_submissions");
    expect(values).toEqual([
      "submission-api-id",
      "lead-db-id",
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
