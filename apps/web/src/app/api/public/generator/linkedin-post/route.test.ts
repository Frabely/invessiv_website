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
  sendMail: vi.fn(),
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

vi.mock("@/server/linkedin-post/render-linkedin-post-service", () => ({
  renderLinkedinPostService: {
    renderLinkedInPostPng: mocks.renderLinkedInPostPng,
  },
}));

vi.mock(
  "@/server/linkedin-post/linkedin-post-generator-usage-limit-service",
  () => ({
    GeneratorUsageLimitUnavailableError: class GeneratorUsageLimitUnavailableError extends Error {},
    linkedinPostGeneratorUsageLimitService: {
      releaseLinkedInPostGeneratorUsage:
        mocks.releaseLinkedInPostGeneratorUsage,
      reserveLinkedInPostGeneratorUsage:
        mocks.reserveLinkedInPostGeneratorUsage,
      toUsageLimitSnapshot: mocks.toUsageLimitSnapshot,
    },
  }),
);

vi.mock("@/server/services/mail/mail-service", () => ({
  sendMail: mocks.sendMail,
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
    mocks.generateLinkedInPost.mockResolvedValue(GENERATED_RESULT);
    mocks.renderLinkedInPostPng.mockResolvedValue(Buffer.from("fake-png"));
    mocks.reserveLinkedInPostGeneratorUsage.mockResolvedValue({
      allowed: true,
      keyHash: "hash",
      limit: 2,
      remaining: 1,
      resetAt: new Date("2026-07-01T00:00:00.000Z"),
    });
    mocks.releaseLinkedInPostGeneratorUsage.mockResolvedValue(undefined);
    mocks.sendMail.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
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
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
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
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
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

  it("keeps the API result successful when mail delivery fails", async () => {
    mocks.sendMail.mockResolvedValue({
      ok: false,
      reason: "delivery_unavailable",
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

    const payload = (await response.json()) as { ok: boolean };
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
  });

  it("skips mail delivery when no email is provided", async () => {
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

    const payload = (await response.json()) as { ok: boolean };
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mocks.sendMail).not.toHaveBeenCalled();
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
