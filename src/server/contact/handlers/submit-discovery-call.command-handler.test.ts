import { beforeEach, describe, expect, it, vi } from "vitest";

const { persistDiscoveryCallLeadMock } = vi.hoisted(() => ({
  persistDiscoveryCallLeadMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/services/contact/persist-contact-lead", () => ({
  persistDiscoveryCallLead: persistDiscoveryCallLeadMock,
}));

describe("submitDiscoveryCallCommandHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistDiscoveryCallLeadMock.mockResolvedValue({ persisted: true });
  });

  it("returns validation errors from handler-side zod validation", async () => {
    const { submitDiscoveryCallCommandHandler } =
      await import("@/server/contact/handlers/submit-discovery-call.command-handler");

    const result = await submitDiscoveryCallCommandHandler(
      {
        consentAccepted: false,
        email: "invalid",
        firstName: "",
        kind: "discovery_call",
        lastName: "",
        locale: "de",
        message: "Test",
      },
      "req_123",
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected validation failure");
    }
    expect(result.code).toBe("validation_error");
    expect(result.fieldErrors?.email).toContain("invalid_email");
    expect(persistDiscoveryCallLeadMock).not.toHaveBeenCalled();
  });

  it("persists a valid discovery call without mail delivery", async () => {
    const { submitDiscoveryCallCommandHandler } =
      await import("@/server/contact/handlers/submit-discovery-call.command-handler");

    const result = await submitDiscoveryCallCommandHandler(
      {
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        kind: "discovery_call",
        lastName: "Mustermann",
        locale: "de",
        message: "Wir wollen den Umfang kurz einordnen.",
      },
      "req_123",
    );

    expect(result).toEqual({ ok: true });
    expect(persistDiscoveryCallLeadMock).toHaveBeenCalledTimes(1);
  });
});
