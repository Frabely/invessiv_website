import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

describe("POST /api/public/contact", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("CONTACT_MAIL_PROVIDER", "resend");
    vi.stubEnv("CONTACT_MAIL_FROM", "Invessiv <noreply@invessiv.com>");
    vi.stubEnv("CONTACT_MAIL_TO", "service@invessiv.com");
    vi.stubEnv("RESEND_API_KEY", "resend_test_key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ id: "email_123" }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
          }),
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns success for a valid request", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/public/contact", {
        body: JSON.stringify({
          consentAccepted: true,
          email: "max@example.com",
          firstName: "Max",
          goalKey: "generate_inquiries",
          kind: "project_request",
          lastName: "Mustermann",
          locale: "de",
          offerKey: "landing",
          projectDetails:
            "Eine Landingpage für qualifizierte Leads mit sauberem CTA-Flow.",
          startedAt: "2026-03-20T10:00:00.000Z",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }) as NextRequest,
    );

    const payload = (await response.json()) as {
      ok: boolean;
      requestId: string;
    };
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.requestId).toBeTruthy();
  });

  it("returns validation errors for invalid payloads", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/public/contact", {
        body: JSON.stringify({
          consentAccepted: false,
          email: "invalid",
          firstName: "",
          kind: "project_request",
          lastName: "",
          locale: "de",
          offerKey: "landing",
          projectDetails: "Zu kurz",
          startedAt: "2026-03-20T10:00:00.000Z",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }) as NextRequest,
    );

    const payload = (await response.json()) as {
      code: string;
      fieldErrors?: Record<string, string[]>;
      ok: boolean;
    };

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("validation_error");
    expect(payload.fieldErrors?.email).toContain("invalid_email");
  });

  it("returns 429 after repeated requests from the same identifier", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-20T10:00:10.000Z"));
    const { POST } = await import("./route");
    const { resetContactRateLimitStore } =
      await import("@/server/services/anti-abuse/contact-rate-limit");
    resetContactRateLimitStore();

    const createRequest = () =>
      new Request("http://localhost/api/public/contact", {
        body: JSON.stringify({
          consentAccepted: true,
          email: "max@example.com",
          firstName: "Max",
          goalKey: "generate_inquiries",
          kind: "project_request",
          lastName: "Mustermann",
          locale: "de",
          offerKey: "landing",
          projectDetails:
            "Eine Landingpage für qualifizierte Leads mit sauberem CTA-Flow.",
          startedAt: "2026-03-20T10:00:00.000Z",
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.10",
        },
        method: "POST",
      }) as NextRequest;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await POST(createRequest());
      expect(response.status).toBe(200);
    }

    const blockedResponse = await POST(createRequest());
    const payload = (await blockedResponse.json()) as {
      code: string;
      ok: boolean;
    };

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.headers.get("Retry-After")).toBeTruthy();
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("rate_limited");
  });

  it("returns delivery_unavailable when the mail provider throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ message: "provider failed" }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
          }),
        ),
      ),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/public/contact", {
        body: JSON.stringify({
          consentAccepted: true,
          email: "max@example.com",
          firstName: "Max",
          goalKey: "generate_inquiries",
          kind: "project_request",
          lastName: "Mustermann",
          locale: "de",
          offerKey: "landing",
          projectDetails:
            "Eine Landingpage für qualifizierte Leads mit sauberem CTA-Flow.",
          startedAt: "2026-03-20T10:00:00.000Z",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }) as NextRequest,
    );

    const payload = (await response.json()) as { code: string; ok: boolean };

    expect(response.status).toBe(503);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("delivery_unavailable");
  });

  it("returns internal_error when submission orchestration throws unexpectedly", async () => {
    vi.doMock(
      "@/server/contact/handlers/submit-project-request.command-handler",
      () => ({
        submitProjectRequestCommandHandler: vi
          .fn()
          .mockRejectedValue(new Error("unexpected_failure")),
      }),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/public/contact", {
        body: JSON.stringify({
          consentAccepted: true,
          email: "max@example.com",
          firstName: "Max",
          goalKey: "generate_inquiries",
          kind: "project_request",
          lastName: "Mustermann",
          locale: "de",
          offerKey: "landing",
          projectDetails:
            "Eine Landingpage für qualifizierte Leads mit sauberem CTA-Flow.",
          startedAt: "2026-03-20T10:00:00.000Z",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }) as NextRequest,
    );

    const payload = (await response.json()) as { code: string; ok: boolean };

    expect(response.status).toBe(500);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("internal_error");
  });

  it("dispatches quick_contact requests separately", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/public/contact", {
        body: JSON.stringify({
          consentAccepted: true,
          email: "max@example.com",
          firstName: "Max",
          kind: "quick_contact",
          lastName: "Mustermann",
          locale: "de",
          message: "Kurze erste Anfrage mit zwei Saetzen.",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }) as NextRequest,
    );

    const payload = (await response.json()) as {
      ok: boolean;
      requestId: string;
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.requestId).toBeTruthy();
  });
});
