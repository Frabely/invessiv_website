import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const TOKEN_PAYLOAD = {
  caption: "Caption\n\n#B2B",
  downloadFileName: "pricing.png",
  exp: Date.now() + 60_000,
  locale: "en" as const,
  post: {
    authorName: "Max Mustermann",
    bodyVariant: "insight" as const,
    bullets: null,
    colorPair: {
      accent: "#5BA3D9",
      id: "navy-steel",
      index: 0,
      primary: "#0F1B2D",
      secondary: "#1A3355",
      text: "#E8F1FA",
    },
    expertiseDisplay: "Consulting",
    headlineHtml: "Sharp <em>pricing</em>",
    headlinePlain: "Sharp pricing",
    highlight: null,
    insight: "A concise observation.",
    kicker: "Pricing",
    template: {
      bodyVariant: "insight" as const,
      id: "editorial-center",
      index: 0,
    },
  },
};

const mocks = vi.hoisted(() => ({
  verifyDeliveryToken: vi.fn(),
  DeliveryTokenInvalidReason: { Expired: "expired", Malformed: "malformed" },
  DeliveryTokenSecretMissingError: class DeliveryTokenSecretMissingError extends Error {},
  reserveLinkedInPostDeliveryUsage: vi.fn(),
  releaseLinkedInPostDeliveryUsage: vi.fn(),
  GeneratorUsageLimitUnavailableError: class GeneratorUsageLimitUnavailableError extends Error {},
  renderLinkedInPostHtml: vi.fn(),
  renderLinkedInPostPng: vi.fn(),
  sendMail: vi.fn(),
  createLinkedInPostGeneratorResultMessage: vi.fn(),
  persistLinkedInPostDeliveryLead: vi.fn(),
}));

vi.mock("@/server/linkedin-post/linkedin-post-delivery-token-service", () => ({
  DeliveryTokenInvalidReason: mocks.DeliveryTokenInvalidReason,
  DeliveryTokenSecretMissingError: mocks.DeliveryTokenSecretMissingError,
  linkedinPostDeliveryTokenService: {
    verifyDeliveryToken: mocks.verifyDeliveryToken,
  },
}));

vi.mock(
  "@/server/linkedin-post/linkedin-post-delivery-rate-limit-service",
  () => ({
    linkedinPostDeliveryRateLimitService: {
      releaseLinkedInPostDeliveryUsage: mocks.releaseLinkedInPostDeliveryUsage,
      reserveLinkedInPostDeliveryUsage: mocks.reserveLinkedInPostDeliveryUsage,
    },
  }),
);

vi.mock(
  "@/server/linkedin-post/linkedin-post-generator-usage-key-service",
  () => ({
    GeneratorUsageLimitUnavailableError:
      mocks.GeneratorUsageLimitUnavailableError,
  }),
);

vi.mock("@/server/linkedin-post/render-linkedin-post-service", () => ({
  renderLinkedinPostService: {
    renderLinkedInPostHtml: mocks.renderLinkedInPostHtml,
    renderLinkedInPostPng: mocks.renderLinkedInPostPng,
  },
}));

vi.mock("@/server/services/mail/mail-service", () => ({
  sendMail: mocks.sendMail,
}));

vi.mock(
  "@/server/services/mail/templates/linkedin-post-generator-result",
  () => ({
    createLinkedInPostGeneratorResultMessage:
      mocks.createLinkedInPostGeneratorResultMessage,
  }),
);

vi.mock("@invessiv/db/contact/persist-linkedin-post-delivery", () => ({
  persistLinkedInPostDeliveryLead: mocks.persistLinkedInPostDeliveryLead,
}));

function createRequest(body: unknown) {
  return new Request(
    "http://localhost/api/public/generator/linkedin-post/deliver",
    {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  ) as NextRequest;
}

const VALID_BODY = {
  company: "",
  consentDelivery: true,
  consentMarketing: false,
  deliveryToken: "signed-token",
  displayName: "Max Mustermann",
  email: "max@example.com",
  locale: "en",
};

describe("POST /api/public/generator/linkedin-post/deliver", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.verifyDeliveryToken.mockReturnValue({
      payload: TOKEN_PAYLOAD,
      valid: true,
    });
    mocks.reserveLinkedInPostDeliveryUsage.mockResolvedValue({
      allowed: true,
      keyHash: "hash",
      limit: 10,
      remaining: 9,
      resetAt: new Date("2026-07-01T00:00:00.000Z"),
    });
    mocks.releaseLinkedInPostDeliveryUsage.mockResolvedValue(undefined);
    mocks.renderLinkedInPostHtml.mockReturnValue("<html></html>");
    mocks.renderLinkedInPostPng.mockResolvedValue(Buffer.from("png"));
    mocks.createLinkedInPostGeneratorResultMessage.mockResolvedValue({
      to: "max@example.com",
    });
    mocks.sendMail.mockResolvedValue({ ok: true });
    mocks.persistLinkedInPostDeliveryLead.mockResolvedValue({
      persisted: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("delivers the post by email and persists the lead", async () => {
    const { POST } = await import("./route");
    const response = await POST(createRequest(VALID_BODY));

    const payload = (await response.json()) as { ok: boolean };
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.persistLinkedInPostDeliveryLead).toHaveBeenCalledTimes(1);
    expect(mocks.reserveLinkedInPostDeliveryUsage).toHaveBeenCalledTimes(1);
    expect(
      mocks.persistLinkedInPostDeliveryLead.mock.invocationCallOrder[0],
    ).toBeGreaterThan(mocks.sendMail.mock.invocationCallOrder[0]);
  });

  it("rejects an invalid token without reserving budget or sending mail", async () => {
    mocks.verifyDeliveryToken.mockReturnValue({
      reason: mocks.DeliveryTokenInvalidReason.Malformed,
      valid: false,
    });
    const { POST } = await import("./route");
    const response = await POST(createRequest(VALID_BODY));

    const payload = (await response.json()) as { code: string; ok: boolean };
    expect(response.status).toBe(400);
    expect(payload.code).toBe("delivery_token_invalid");
    expect(mocks.reserveLinkedInPostDeliveryUsage).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    mocks.verifyDeliveryToken.mockReturnValue({
      reason: mocks.DeliveryTokenInvalidReason.Expired,
      valid: false,
    });
    const { POST } = await import("./route");
    const response = await POST(createRequest(VALID_BODY));

    const payload = (await response.json()) as { code: string };
    expect(response.status).toBe(422);
    expect(payload.code).toBe("delivery_token_expired");
  });

  it("returns 429 when the deliver rate limit is reached", async () => {
    mocks.reserveLinkedInPostDeliveryUsage.mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      resetAt: new Date("2026-07-01T00:00:00.000Z"),
    });
    const { POST } = await import("./route");
    const response = await POST(createRequest(VALID_BODY));

    const payload = (await response.json()) as { code: string };
    expect(response.status).toBe(429);
    expect(payload.code).toBe("delivery_rate_limited");
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("releases the reservation and fails when mail delivery fails", async () => {
    mocks.sendMail.mockResolvedValue({ ok: false, reason: "smtp_down" });
    const { POST } = await import("./route");
    const response = await POST(createRequest(VALID_BODY));

    const payload = (await response.json()) as { code: string; ok: boolean };
    expect(response.status).toBe(503);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("delivery_unavailable");
    expect(mocks.releaseLinkedInPostDeliveryUsage).toHaveBeenCalledTimes(1);
    expect(mocks.persistLinkedInPostDeliveryLead).not.toHaveBeenCalled();
  });

  it("releases the reservation and skips lead persistence when rendering fails", async () => {
    mocks.renderLinkedInPostPng.mockResolvedValue(null);
    const { POST } = await import("./route");
    const response = await POST(createRequest(VALID_BODY));

    const payload = (await response.json()) as { code: string; ok: boolean };
    expect(response.status).toBe(503);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("delivery_unavailable");
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(mocks.persistLinkedInPostDeliveryLead).not.toHaveBeenCalled();
    expect(mocks.releaseLinkedInPostDeliveryUsage).toHaveBeenCalledTimes(1);
  });

  it("stays successful even if lead persistence throws", async () => {
    mocks.persistLinkedInPostDeliveryLead.mockRejectedValue(
      new Error("db_down"),
    );
    const { POST } = await import("./route");
    const response = await POST(createRequest(VALID_BODY));

    const payload = (await response.json()) as { ok: boolean };
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });

  it("returns validation errors for an invalid payload", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({ ...VALID_BODY, email: "not-an-email" }),
    );

    const payload = (await response.json()) as {
      code: string;
      fieldErrors?: Record<string, string[]>;
      ok: boolean;
    };
    expect(response.status).toBe(400);
    expect(payload.code).toBe("validation_error");
    expect(payload.fieldErrors?.email).toBeTruthy();
    expect(mocks.verifyDeliveryToken).not.toHaveBeenCalled();
  });

  it("blocks honeypot submissions", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({ ...VALID_BODY, company: "bot" }),
    );

    const payload = (await response.json()) as { code: string };
    expect(response.status).toBe(400);
    expect(payload.code).toBe("spam_detected");
    expect(mocks.verifyDeliveryToken).not.toHaveBeenCalled();
  });
});
