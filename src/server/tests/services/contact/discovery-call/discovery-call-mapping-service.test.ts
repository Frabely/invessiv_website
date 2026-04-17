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

    const { mapDiscoveryCallDtoToDbPersistInput } =
      await import("@/server/services/contact/discovery-call/discovery-call-mapping-service");

    const createdAt = new Date("2026-03-26T09:30:00.000Z");
    const result = mapDiscoveryCallDtoToDbPersistInput(
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
    expect(result.lead_submission.id).toBe("submission-id-1");
    expect(result.lead_submission.lead_id).toBe(result.lead.id);
    expect(result.call_contact.id).toBe("call-contact-id-1");
    expect(result.call_contact.lead_submission_id).toBe(
      result.lead_submission.id,
    );
    expect(result.call_contact.message).toBe(
      "Wir wollen den Umfang kurz einordnen.",
    );
  });
});
