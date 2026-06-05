import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { LinkedInPostGeneratorPostDto } from "@/common/contracts/generator";
import {
  DeliveryTokenInvalidReason,
  LINKEDIN_POST_DELIVERY_TOKEN_TTL_MS,
} from "@/common/constants/generator";
import {
  DeliveryTokenSecretMissingError,
  linkedinPostDeliveryTokenService,
} from "./linkedin-post-delivery-token-service";

const POST: LinkedInPostGeneratorPostDto = {
  authorName: "Max Mustermann",
  bodyVariant: "insight",
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
  template: { bodyVariant: "insight", id: "editorial-center", index: 0 },
};

const INPUT = {
  caption: "Caption\n\n#B2B",
  downloadFileName: "pricing.png",
  locale: "de" as const,
  post: POST,
};

describe("linkedinPostDeliveryTokenService", () => {
  beforeEach(() => {
    vi.stubEnv("GENERATOR_DELIVERY_TOKEN_SECRET", "test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("signs and verifies a token, returning the original payload", () => {
    const now = Date.UTC(2026, 5, 5);
    const token = linkedinPostDeliveryTokenService.createDeliveryToken(
      INPUT,
      now,
    );

    const result = linkedinPostDeliveryTokenService.verifyDeliveryToken(
      token,
      now + 1000,
    );

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payload.caption).toBe(INPUT.caption);
      expect(result.payload.downloadFileName).toBe(INPUT.downloadFileName);
      expect(result.payload.locale).toBe("de");
      expect(result.payload.post.headlinePlain).toBe("Sharp pricing");
      expect(result.payload.exp).toBe(
        now + LINKEDIN_POST_DELIVERY_TOKEN_TTL_MS,
      );
    }
  });

  it("rejects an expired token", () => {
    const now = Date.UTC(2026, 5, 5);
    const token = linkedinPostDeliveryTokenService.createDeliveryToken(
      INPUT,
      now,
    );

    const result = linkedinPostDeliveryTokenService.verifyDeliveryToken(
      token,
      now + LINKEDIN_POST_DELIVERY_TOKEN_TTL_MS + 1,
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe(DeliveryTokenInvalidReason.Expired);
    }
  });

  it("rejects a token with a tampered payload", () => {
    const token = linkedinPostDeliveryTokenService.createDeliveryToken(INPUT);
    const [, signatureSegment] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...INPUT, exp: Date.now() + 1000, post: POST }),
      "utf8",
    ).toString("base64url");

    const result = linkedinPostDeliveryTokenService.verifyDeliveryToken(
      `${forgedPayload}.${signatureSegment}`,
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe(DeliveryTokenInvalidReason.Malformed);
    }
  });

  it("rejects a token signed with a different secret", () => {
    const token = linkedinPostDeliveryTokenService.createDeliveryToken(INPUT);
    vi.stubEnv("GENERATOR_DELIVERY_TOKEN_SECRET", "other-secret");

    const result = linkedinPostDeliveryTokenService.verifyDeliveryToken(token);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe(DeliveryTokenInvalidReason.Malformed);
    }
  });

  it("rejects a structurally malformed token", () => {
    const result =
      linkedinPostDeliveryTokenService.verifyDeliveryToken("not-a-token");

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe(DeliveryTokenInvalidReason.Malformed);
    }
  });

  it("throws when the delivery secret is missing", () => {
    vi.stubEnv("GENERATOR_DELIVERY_TOKEN_SECRET", "");

    expect(() =>
      linkedinPostDeliveryTokenService.createDeliveryToken(INPUT),
    ).toThrow(DeliveryTokenSecretMissingError);
  });
});
