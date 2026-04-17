import { describe, expect, it, vi } from "vitest";

const { randomUUIDMock } = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("node:crypto", () => ({
  randomUUID: randomUUIDMock,
}));

describe("mapSubmissionApiToDb", () => {
  it("maps the submission metadata and keeps the started-at timestamp", async () => {
    randomUUIDMock.mockReturnValueOnce("submission-id-1");

    const { mapSubmissionApiToDb } =
      await import("@/server/services/contact/submission-mapping-service");

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const startedAt = new Date("2026-03-26T09:00:00.000Z");
    const result = mapSubmissionApiToDb(
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
