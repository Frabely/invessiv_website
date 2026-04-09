import { describe, expect, it, vi } from "vitest";

const { submitContactInquiryMock } = vi.hoisted(() => ({
  submitContactInquiryMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/services/contact/submit-contact-inquiry", () => ({
  submitContactInquiry: submitContactInquiryMock,
}));

describe("submitProjectRequestCommandHandler", () => {
  it("returns validation errors from handler-side zod validation", async () => {
    const { submitProjectRequestCommandHandler } =
      await import("@/server/contact/handlers/submit-project-request.command-handler");

    const result = await submitProjectRequestCommandHandler(
      {
        consentAccepted: false,
        email: "invalid",
        fullName: "",
        kind: "project_request",
        locale: "de",
        offerKey: "landing",
        projectDetails: "Kurz",
        startedAt: "2026-04-10T10:00:00.000Z",
      },
      "req_123",
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected validation failure");
    }
    expect(result.code).toBe("validation_error");
    expect(result.fieldErrors?.email).toContain("invalid_email");
    expect(submitContactInquiryMock).not.toHaveBeenCalled();
  });

  it("delegates valid commands to the project request service", async () => {
    submitContactInquiryMock.mockResolvedValueOnce({ ok: true });

    const { submitProjectRequestCommandHandler } =
      await import("@/server/contact/handlers/submit-project-request.command-handler");

    const result = await submitProjectRequestCommandHandler(
      {
        consentAccepted: true,
        email: "max@example.com",
        fullName: "Max Mustermann",
        goalKey: "generate_inquiries",
        kind: "project_request",
        locale: "de",
        offerKey: "landing",
        projectDetails: "Landingpage fuer qualifizierte Leads.",
        startedAt: "2026-04-10T10:00:00.000Z",
      },
      "req_123",
    );

    expect(result).toEqual({ ok: true });
    expect(submitContactInquiryMock).toHaveBeenCalledTimes(1);
  });
});
