import { describe, expect, it, vi } from "vitest";

const { randomUUIDMock } = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("node:crypto", () => ({
  randomUUID: randomUUIDMock,
}));

describe("mapQuickContactApiToDb", () => {
  it("creates linked lead, submission, and email contact records", async () => {
    randomUUIDMock
      .mockReturnValueOnce("lead-id-1")
      .mockReturnValueOnce("submission-id-1")
      .mockReturnValueOnce("email-contact-id-1");

    const { mapQuickContactApiToDb } = await import(
      "@/server/services/contact/quick-contact/quick-contact-mapping-service"
    );

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const result = mapQuickContactApiToDb(
      {
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        kind: "quick_contact",
        lastName: "Mustermann",
        locale: "de",
        message: "Kurze erste Anfrage.",
      },
      { requestId: "request_456", createdAt },
    );

    expect(result.lead.id).toBe("lead-id-1");
    expect(result.submission.id).toBe("submission-id-1");
    expect(result.emailContact.id).toBe("email-contact-id-1");
    expect(result.emailContact.leadSubmissionId).toBe(result.submission.id);
    expect(result.emailContact.message).toBe("Kurze erste Anfrage.");
  });
});
