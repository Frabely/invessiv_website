import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const GENERATED_RESULT = {
  caption: "Caption\n\n#B2B #LinkedIn",
  downloadFileName: "pricing.png",
  imageDataUrl: null,
  ok: true as const,
  post: {
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
    authorName: "Max Mustermann",
    expertiseDisplay: "Consulting",
    kicker: "Pricing",
    headlineHtml: "Sharp <em>pricing</em>",
    headlinePlain: "Sharp pricing",
    highlight: null,
    insight: "A concise observation.",
    template: {
      bodyVariant: "insight" as const,
      id: "editorial-center",
      index: 0,
    },
  },
  previewHtml: '<html><body class="post"></body></html>',
};

const mocks = vi.hoisted(() => ({
  generateLinkedInPost: vi.fn(),
  buildMockLinkedInPostGeneratorSuccessResult: vi.fn(),
  LinkedInPostGenerationError: class LinkedInPostGenerationError extends Error {
    constructor(
      readonly code: string,
      readonly stage: string,
      message: string,
    ) {
      super(message);
      this.name = "LinkedInPostGenerationError";
    }
  },
  renderLinkedInPostPng: vi.fn(),
  releaseLinkedInPostGeneratorUsage: vi.fn(),
  reserveLinkedInPostGeneratorUsage: vi.fn(),
  createDeliveryToken: vi.fn(),
  DeliveryTokenSecretMissingError: class DeliveryTokenSecretMissingError extends Error {},
  GeneratorUsageLimitUnavailableError: class GeneratorUsageLimitUnavailableError extends Error {},
  toUsageLimitSnapshot: vi.fn((reservation) => ({
    limit: reservation.limit,
    remaining: reservation.remaining,
    resetAt: reservation.resetAt.toISOString(),
  })),
}));

vi.mock("@/server/linkedin-post/linkedin-post-openai-adapter-service", () => ({
  LinkedInPostGenerationError: mocks.LinkedInPostGenerationError,
}));

vi.mock("@/server/linkedin-post/linkedin-post-generator-service", () => ({
  generateLinkedInPost: mocks.generateLinkedInPost,
}));

vi.mock("@/server/linkedin-post/linkedin-post-generator-mock-service", () => ({
  linkedinPostGeneratorMockService: {
    buildMockLinkedInPostGeneratorSuccessResult:
      mocks.buildMockLinkedInPostGeneratorSuccessResult,
  },
}));

vi.mock("@/server/linkedin-post/render-linkedin-post-service", () => ({
  renderLinkedinPostService: {
    renderLinkedInPostPng: mocks.renderLinkedInPostPng,
  },
}));

vi.mock(
  "@/server/linkedin-post/linkedin-post-generator-usage-limit-service",
  () => ({
    linkedinPostGeneratorUsageLimitService: {
      releaseLinkedInPostGeneratorUsage:
        mocks.releaseLinkedInPostGeneratorUsage,
      reserveLinkedInPostGeneratorUsage:
        mocks.reserveLinkedInPostGeneratorUsage,
      toUsageLimitSnapshot: mocks.toUsageLimitSnapshot,
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

vi.mock("@/server/linkedin-post/linkedin-post-delivery-token-service", () => ({
  DeliveryTokenSecretMissingError: mocks.DeliveryTokenSecretMissingError,
  linkedinPostDeliveryTokenService: {
    createDeliveryToken: mocks.createDeliveryToken,
  },
}));

function createRequest(body: unknown) {
  return new Request("http://localhost/api/public/generator/linkedin-post", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  }) as NextRequest;
}

describe("POST /api/public/generator/linkedin-post", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_LINKEDIN_POST_GENERATOR_USE_MOCK", "false");
    mocks.generateLinkedInPost.mockResolvedValue(GENERATED_RESULT);
    mocks.buildMockLinkedInPostGeneratorSuccessResult.mockResolvedValue({
      ...GENERATED_RESULT,
      imageDataUrl: null,
      previewHtml: GENERATED_RESULT.previewHtml,
    });
    mocks.renderLinkedInPostPng.mockResolvedValue(Buffer.from("fake-png"));
    mocks.reserveLinkedInPostGeneratorUsage.mockResolvedValue({
      allowed: true,
      keyHash: "hash",
      limit: 2,
      remaining: 1,
      resetAt: new Date("2026-07-01T00:00:00.000Z"),
    });
    mocks.releaseLinkedInPostGeneratorUsage.mockResolvedValue(undefined);
    mocks.createDeliveryToken.mockReturnValue("signed-delivery-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns generated content for a valid request", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        colorPairId: "navy-steel",
        company: "",
        consent: true,
        displayName: "Max Mustermann",
        email: "max@example.com",
        expertise: "Consulting",
        locale: "en",
        tone: "sachlich",
        topic: "Pricing conversations",
      }),
    );

    const payload = (await response.json()) as typeof GENERATED_RESULT & {
      deliveryToken?: string;
      usageLimit?: { limit: number; remaining: number; resetAt: string };
    };
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.post.headlinePlain).toBe("Sharp pricing");
    expect(payload.imageDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(payload.usageLimit).toEqual({
      limit: 2,
      remaining: 1,
      resetAt: "2026-07-01T00:00:00.000Z",
    });
    // Generation no longer sends mail; it returns a signed deliver token that
    // gates the separate "post per E-Mail schicken" step.
    expect(payload.deliveryToken).toBe("signed-delivery-token");
    expect(mocks.createDeliveryToken).toHaveBeenCalledTimes(1);
  });

  it("uses the server-side mock generator without contacting OpenAI when the mock env is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_LINKEDIN_POST_GENERATOR_USE_MOCK", "true");
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        colorPairId: "auto",
        company: "",
        consent: true,
        displayName: "Max Mustermann",
        email: "max@example.com",
        expertise: "Consulting",
        locale: "en",
        tone: "sachlich",
        topic: "Pricing conversations",
      }),
    );

    const payload = (await response.json()) as typeof GENERATED_RESULT & {
      usageLimit?: { limit: number; remaining: number; resetAt: string };
    };
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mocks.generateLinkedInPost).not.toHaveBeenCalled();
    expect(
      mocks.buildMockLinkedInPostGeneratorSuccessResult,
    ).toHaveBeenCalled();
  });

  it("blocks when the server-side usage limit is reached", async () => {
    mocks.reserveLinkedInPostGeneratorUsage.mockResolvedValue({
      allowed: false,
      limit: 2,
      remaining: 0,
      resetAt: new Date("2026-07-01T00:00:00.000Z"),
    });

    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        colorPairId: "auto",
        company: "",
        consent: false,
        displayName: "",
        email: "",
        expertise: "Consulting",
        locale: "en",
        tone: "sachlich",
        topic: "Pricing conversations",
      }),
    );

    const payload = (await response.json()) as {
      code: string;
      ok: boolean;
      usageLimit?: { limit: number; remaining: number; resetAt: string };
    };
    expect(response.status).toBe(429);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("usage_limit_reached");
    expect(payload.usageLimit).toEqual({
      limit: 2,
      remaining: 0,
      resetAt: "2026-07-01T00:00:00.000Z",
    });
    expect(mocks.generateLinkedInPost).not.toHaveBeenCalled();
  });

  it("stays successful with a null image when the PNG render fails", async () => {
    mocks.renderLinkedInPostPng.mockRejectedValue(new Error("render_timeout"));
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        colorPairId: "auto",
        company: "",
        consent: true,
        displayName: "Max Mustermann",
        email: "max@example.com",
        expertise: "Consulting",
        locale: "en",
        tone: "sachlich",
        topic: "Pricing conversations",
      }),
    );

    const payload = (await response.json()) as {
      imageDataUrl: string | null;
      ok: boolean;
    };
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.imageDataUrl).toBeNull();
  });

  it("returns validation errors for invalid payloads", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        colorPairId: "auto",
        company: "",
        consent: false,
        displayName: "",
        email: "invalid",
        expertise: "Consulting",
        locale: "en",
        tone: "sachlich",
        topic: "Pricing conversations",
      }),
    );

    const payload = (await response.json()) as {
      fieldErrors?: Record<string, string[]>;
      ok: boolean;
    };
    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.fieldErrors?.email).toBeTruthy();
    expect(mocks.generateLinkedInPost).not.toHaveBeenCalled();
  });

  it("stays successful without a deliveryToken when the delivery secret is missing", async () => {
    mocks.createDeliveryToken.mockImplementation(() => {
      throw new mocks.DeliveryTokenSecretMissingError();
    });
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        colorPairId: "auto",
        company: "",
        consent: true,
        displayName: "Max Mustermann",
        email: "max@example.com",
        expertise: "Consulting",
        locale: "en",
        tone: "provokativ",
        topic: "Pricing conversations",
      }),
    );

    const payload = (await response.json()) as {
      deliveryToken?: string;
      ok: boolean;
    };
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.deliveryToken).toBeUndefined();
  });

  it("blocks honeypot submissions", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        colorPairId: "auto",
        company: "bot",
        consent: true,
        displayName: "Max Mustermann",
        email: "max@example.com",
        expertise: "Consulting",
        locale: "en",
        tone: "sachlich",
        topic: "Pricing conversations",
      }),
    );

    const payload = (await response.json()) as { code: string; ok: boolean };
    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("spam_detected");
  });

  it("returns a specific OpenAI failure code with a debug stage", async () => {
    mocks.generateLinkedInPost.mockRejectedValue(
      new mocks.LinkedInPostGenerationError(
        "openai_invalid_content",
        "openai_quality_gate",
        "caption.hashtags:linkedin_hashtag_must_be_last",
      ),
    );

    const { POST } = await import("./route");
    const response = await POST(
      createRequest({
        colorPairId: "auto",
        company: "",
        consent: true,
        displayName: "Max Mustermann",
        email: "max@example.com",
        expertise: "Consulting",
        locale: "en",
        tone: "provokativ",
        topic: "Pricing conversations",
      }),
    );

    const payload = (await response.json()) as {
      code: string;
      debug?: { reason?: string; stage: string };
      ok: boolean;
    };
    expect(response.status).toBe(422);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("openai_invalid_content");
    expect(payload.debug?.stage).toBe("openai_quality_gate");
    expect(mocks.releaseLinkedInPostGeneratorUsage).toHaveBeenCalledTimes(1);
  });
});
