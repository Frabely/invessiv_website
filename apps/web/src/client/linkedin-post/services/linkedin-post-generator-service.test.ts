import { afterEach, describe, expect, it, vi } from "vitest";
import { WebApiEndpoint } from "@/common/constants";
import { linkedinPostGeneratorService } from "./linkedin-post-generator-service";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("linkedinPostGeneratorService.submitLinkedInPost", () => {
  it("posts form values with the active locale", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            caption: "Caption",
            downloadFileName: "post.png",
            imageDataUrl: null,
            ok: true,
            post: {
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
              authorName: "Max Mustermann",
              expertiseDisplay: "Consulting",
              headlineHtml: "Sharp <em>point</em>",
              headlinePlain: "Sharp point",
              highlight: null,
              insight: "A useful observation.",
              kicker: "Pricing",
              template: {
                bodyVariant: "insight",
                id: "editorial-center",
                index: 0,
              },
            },
            usageLimit: {
              limit: 2,
              remaining: 1,
              resetAt: "2026-07-01T00:00:00.000Z",
            },
          }),
        ),
      ),
    );

    const result = await linkedinPostGeneratorService.submitLinkedInPost(
      {
        colorPairId: "auto",
        company: "",
        consent: true,
        displayName: "Max Mustermann",
        email: "test@example.com",
        expertise: "Consulting",
        tone: "sachlich",
        topic: "Pricing",
      },
      "en",
    );

    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      WebApiEndpoint.LinkedInPostGenerate,
      expect.objectContaining({
        method: "POST",
      }),
    );
    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(JSON.parse(String(init?.body))).toEqual(
      expect.objectContaining({ locale: "en", topic: "Pricing" }),
    );
    expect(JSON.parse(String(init?.body))).not.toHaveProperty("mode");
  });

  it("falls back to an internal error for malformed response payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }))),
    );

    const result = await linkedinPostGeneratorService.submitLinkedInPost(
      {
        colorPairId: "auto",
        company: "",
        consent: true,
        displayName: "Test User",
        email: "test@example.com",
        expertise: "Consulting",
        tone: "sachlich",
        topic: "Pricing",
      },
      "en",
    );

    expect(result).toEqual({
      code: "internal_error",
      ok: false,
    });
  });
});
