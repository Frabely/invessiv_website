import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OutreachOpenAi } from "@/common/ai-outreach-generation/outreach-openai";
import { outreachProviderStatusService } from "./lead-outreach-provider-status-service";

describe("lead-outreach-provider-status-service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("checkServerProviders", () => {
    it("returns openai available=true when server responds with available=true", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        Response.json({
          ok: true,
          providers: {
            openai: { available: true, model: OutreachOpenAi.DefaultModel },
          },
        }),
      );

      const result = await outreachProviderStatusService.checkServerProviders();

      expect(result).toEqual({
        openai: true,
        model: OutreachOpenAi.DefaultModel,
      });
    });

    it("returns openai available=false when server responds with available=false", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        Response.json({
          ok: true,
          providers: {
            openai: { available: false, model: OutreachOpenAi.DefaultModel },
          },
        }),
      );

      const result = await outreachProviderStatusService.checkServerProviders();

      expect(result).toEqual({
        openai: false,
        model: OutreachOpenAi.DefaultModel,
      });
    });

    it("returns openai=false when fetch fails", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Network error"));

      const result = await outreachProviderStatusService.checkServerProviders();

      expect(result).toEqual({ openai: false, model: null });
    });

    it("returns openai=false when server returns non-ok status", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, { status: 401 }),
      );

      const result = await outreachProviderStatusService.checkServerProviders();

      expect(result).toEqual({ openai: false, model: null });
    });
  });

  describe("checkOutreachProviders", () => {
    it("returns server OpenAI status", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        Response.json({
          ok: true,
          providers: {
            openai: { available: true, model: OutreachOpenAi.DefaultModel },
          },
        }),
      );

      const result =
        await outreachProviderStatusService.checkOutreachProviders();

      expect(result).toEqual({
        openai: true,
        openaiModel: OutreachOpenAi.DefaultModel,
      });
    });

    it("returns openai=false when server status cannot be loaded", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Network error"));

      const result =
        await outreachProviderStatusService.checkOutreachProviders();

      expect(result).toEqual({
        openai: false,
        openaiModel: null,
      });
    });
  });
});
