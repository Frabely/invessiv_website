import { describe, expect, it, vi } from "vitest";

const { randomUUIDMock } = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("node:crypto", () => ({
  randomUUID: randomUUIDMock,
}));

describe("mapDiscoveryCallApiToDb", () => {
  it("creates linked lead, submission, and call contact records", async () => {
    randomUUIDMock
      .mockReturnValueOnce("lead-id-1")
      .mockReturnValueOnce("submission-id-1")
      .mockReturnValueOnce("call-contact-id-1");

    const { mapDiscoveryCallApiToDb } = await import(
      "@/server/services/contact/discovery-call/discovery-call-mapping-service"
    );

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const result = mapDiscoveryCallApiToDb(
      {
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        kind: "discovery_call",
        lastName: "Mustermann",
        locale: "de",
        message: "Wir wollen den Umfang kurz einordnen.",
      },
      { requestId: "request_789", createdAt },
    );

    expect(result.lead.id).toBe("lead-id-1");
    expect(result.submission.id).toBe("submission-id-1");
    expect(result.callContact.id).toBe("call-contact-id-1");
    expect(result.callContact.leadSubmissionId).toBe(result.submission.id);
    expect(result.callContact.message).toBe(
      "Wir wollen den Umfang kurz einordnen.",
    );
  });
});
