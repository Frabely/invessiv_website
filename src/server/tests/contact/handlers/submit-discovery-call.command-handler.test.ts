import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import { CONTACT_VALIDATION_FIELD_ERROR_CODE } from "@/server/contact/validation/shared/contact-validation-field-error-code";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { persistDiscoveryCallLeadMock } = vi.hoisted(() => ({
  persistDiscoveryCallLeadMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@invessiv/db/contact/persist-discovery-call", () => ({
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
        displayName: "",
        kind: CONTACT_REQUEST_KIND.DiscoveryCall,
        locale: "de",
        message: "Test",
      },
      "req_123",
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected validation failure");
    }
    expect(result.code).toBe(CONTACT_SUBMIT_ERROR_CODE.ValidationError);
    expect(result.fieldErrors?.email).toContain(
      CONTACT_VALIDATION_FIELD_ERROR_CODE.InvalidEmail,
    );
    expect(persistDiscoveryCallLeadMock).not.toHaveBeenCalled();
  });

  it("persists a valid discovery call without mail delivery", async () => {
    const { submitDiscoveryCallCommandHandler } =
      await import("@/server/contact/handlers/submit-discovery-call.command-handler");

    const result = await submitDiscoveryCallCommandHandler(
      {
        consentAccepted: true,
        email: "max@example.com",
        displayName: "Max Mustermann",
        kind: CONTACT_REQUEST_KIND.DiscoveryCall,
        locale: "de",
        message: "Wir wollen den Umfang kurz einordnen.",
      },
      "req_123",
    );

    expect(result).toEqual({ ok: true });
    expect(persistDiscoveryCallLeadMock).toHaveBeenCalledTimes(1);
  });

  it("returns delivery unavailable when persistence throws", async () => {
    persistDiscoveryCallLeadMock.mockRejectedValueOnce(new Error("db down"));

    const { submitDiscoveryCallCommandHandler } =
      await import("@/server/contact/handlers/submit-discovery-call.command-handler");

    const result = await submitDiscoveryCallCommandHandler(
      {
        consentAccepted: true,
        email: "max@example.com",
        displayName: "Max Mustermann",
        kind: CONTACT_REQUEST_KIND.DiscoveryCall,
        locale: "de",
        message: "Wir wollen den Umfang kurz einordnen.",
      },
      "req_123",
    );

    expect(result).toEqual({
      code: CONTACT_SUBMIT_ERROR_CODE.DeliveryUnavailable,
      ok: false,
    });
  });
});
