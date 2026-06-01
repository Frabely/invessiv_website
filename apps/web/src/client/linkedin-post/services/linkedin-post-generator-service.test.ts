import { afterEach, describe, expect, it, vi } from "vitest";
import { LinkedInPostGeneratorErrorCode } from "@/common/constants/generator/linkedin-post-generator-error-codes";
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
              expertiseDisplay: "Consulting",
              kicker: "Pricing",
              headlineHtml: "Sharp <em>point</em>",
              headlinePlain: "Sharp point",
              insight: "A useful observation.",
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
        displayName: "Test User",
        email: "test@example.com",
        expertise: "Consulting",
        tone: "sachlich",
        topic: "Pricing",
      },
      "en",
    );

    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "/api/public/generator/linkedin-post",
      expect.objectContaining({
        method: "POST",
      }),
    );
    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(JSON.parse(String(init?.body))).toEqual(
      expect.objectContaining({ locale: "en", topic: "Pricing" }),
    );
  });

  it("falls back to an internal error for malformed response payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ ok: true, caption: "Caption" })),
        ),
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
      "de",
    );

    expect(result).toEqual({
      code: LinkedInPostGeneratorErrorCode.InternalError,
      ok: false,
    });
  });
});
