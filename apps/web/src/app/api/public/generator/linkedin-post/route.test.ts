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
    expect(Object.hasOwn(payload, ["delivery", "Token"].join(""))).toBe(false);
    expect(mocks.generateLinkedInPost).toHaveBeenCalledTimes(1);
    expect(
      mocks.buildMockLinkedInPostGeneratorSuccessResult,
    ).not.toHaveBeenCalled();
  });

  it("uses the server-side mock generator without contacting OpenAI when the mock env is enabled", async () => {
    vi.stubEnv("LINKEDIN_POST_GENERATOR_USE_MOCK", "true");
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

  it("uses OpenAI when the server-side mock env is not exactly true", async () => {
    vi.stubEnv("LINKEDIN_POST_GENERATOR_USE_MOCK", "TRUE");
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

    const payload = (await response.json()) as typeof GENERATED_RESULT;
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mocks.generateLinkedInPost).toHaveBeenCalledTimes(1);
    expect(
      mocks.buildMockLinkedInPostGeneratorSuccessResult,
    ).not.toHaveBeenCalled();
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
    expect(payload.fieldErrors?.email).toContain("invalid_email");
    expect(mocks.generateLinkedInPost).not.toHaveBeenCalled();
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

  it("returns a stable OpenAI failure code without leaking debug details", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
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
      ok: boolean;
    };
    expect(response.status).toBe(422);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("openai_invalid_content");
    expect("debug" in payload).toBe(false);
    const serializedPayload = JSON.stringify(payload);
    expect(serializedPayload).not.toContain("openai_quality_gate");
    expect(serializedPayload).not.toContain("linkedin_hashtag_must_be_last");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "linkedin_post_generator_failed",
      {
        code: "openai_invalid_content",
        reason: "caption.hashtags:linkedin_hashtag_must_be_last",
        stage: "openai_quality_gate",
      },
    );
    expect(mocks.releaseLinkedInPostGeneratorUsage).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });

  it("keeps unexpected provider errors internal", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.generateLinkedInPost.mockRejectedValue(
      new Error("provider stack trace details"),
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
        tone: "sachlich",
        topic: "Pricing conversations",
      }),
    );

    const payload = (await response.json()) as { code: string; ok: boolean };
    expect(response.status).toBe(500);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("internal_error");
    expect("debug" in payload).toBe(false);
    expect(JSON.stringify(payload)).not.toContain(
      "provider stack trace details",
    );
    consoleErrorSpy.mockRestore();
  });

  it("rejects an oversized payload even without a Content-Length header", async () => {
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
        topic: "x".repeat(20_000),
      }),
    );

    const payload = (await response.json()) as { code: string; ok: boolean };
    expect(response.status).toBe(413);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("payload_too_large");
    expect(mocks.generateLinkedInPost).not.toHaveBeenCalled();
  });

  it("rejects an oversized payload with a forged small Content-Length header", async () => {
    const { POST } = await import("./route");
    const request = new Request(
      "http://localhost/api/public/generator/linkedin-post",
      {
        body: JSON.stringify({
          colorPairId: "auto",
          company: "",
          consent: true,
          displayName: "Max Mustermann",
          email: "max@example.com",
          expertise: "Consulting",
          locale: "en",
          tone: "sachlich",
          topic: "x".repeat(20_000),
        }),
        headers: {
          "Content-Length": "10",
          "Content-Type": "application/json",
        },
        method: "POST",
      },
    ) as NextRequest;
    const response = await POST(request);

    const payload = (await response.json()) as { code: string; ok: boolean };
    expect(response.status).toBe(413);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("payload_too_large");
    expect(mocks.generateLinkedInPost).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON bodies as invalid_json", async () => {
    const { POST } = await import("./route");
    const request = new Request(
      "http://localhost/api/public/generator/linkedin-post",
      {
        body: '{"topic":',
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      },
    ) as NextRequest;
    const response = await POST(request);

    const payload = (await response.json()) as { code: string; ok: boolean };
    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("invalid_json");
    expect(mocks.generateLinkedInPost).not.toHaveBeenCalled();
  });
});
