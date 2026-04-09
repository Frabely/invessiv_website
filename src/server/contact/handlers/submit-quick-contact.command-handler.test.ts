import { describe, expect, it, vi } from "vitest";

const { submitQuickContactInquiryMock } = vi.hoisted(() => ({
  submitQuickContactInquiryMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/services/contact/submit-quick-contact-inquiry", () => ({
  submitQuickContactInquiry: submitQuickContactInquiryMock,
}));

describe("submitQuickContactCommandHandler", () => {
  it("returns validation errors from handler-side zod validation", async () => {
    const { submitQuickContactCommandHandler } =
      await import("@/server/contact/handlers/submit-quick-contact.command-handler");

    const result = await submitQuickContactCommandHandler({
      consentAccepted: false,
      email: "invalid",
      fullName: "",
      kind: "quick_contact",
      locale: "de",
      message: "",
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected validation failure");
    }
    expect(result.code).toBe("validation_error");
    expect(result.fieldErrors?.email).toContain("invalid_email");
    expect(submitQuickContactInquiryMock).not.toHaveBeenCalled();
  });

  it("delegates valid commands to the quick contact service", async () => {
    submitQuickContactInquiryMock.mockResolvedValueOnce({ ok: true });

    const { submitQuickContactCommandHandler } =
      await import("@/server/contact/handlers/submit-quick-contact.command-handler");

    const result = await submitQuickContactCommandHandler({
      consentAccepted: true,
      email: "max@example.com",
      fullName: "Max Mustermann",
      kind: "quick_contact",
      locale: "de",
      message: "Kurze erste Anfrage.",
    });

    expect(result).toEqual({ ok: true });
    expect(submitQuickContactInquiryMock).toHaveBeenCalledTimes(1);
  });
});
