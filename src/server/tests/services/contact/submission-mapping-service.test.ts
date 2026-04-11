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

    const { mapSubmissionApiToDb } = await import(
      "@/server/services/contact/submission-mapping-service"
    );

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const startedAt = new Date("2026-03-26T09:00:00.000Z");
    const result = mapSubmissionApiToDb(
      {
        locale: "de",
        startedAt,
      },
      "request_123",
      "project_request",
      createdAt,
    );

    expect(result).toEqual({
      channel: "project_request",
      consentAcceptedAt: createdAt,
      createdAt,
      id: "submission-id-1",
      locale: "de",
      requestId: "request_123",
      submissionStartedAt: startedAt,
      updatedAt: createdAt,
    });
  });
});
