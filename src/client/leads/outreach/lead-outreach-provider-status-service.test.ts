import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OutreachLmStudio,
  OutreachOpenAi,
} from "@/common/ai-outreach-generation/outreach-lm-studio";
import { OutreachLmStudioModelType } from "@/common/ai-outreach-generation/outreach-lm-studio-model-types";
import {
  checkOutreachProviders,
  outreachProviderStatusService,
} from "./lead-outreach-provider-status-service";

describe("lead-outreach-provider-status-service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("window", {
      setTimeout: vi.fn(() => 0),
      clearTimeout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("checkLocalLmStudio", () => {
    it("returns running+modelLoaded when /v1/models reports a loaded LLM instance", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        Response.json({
          data: [
            {
              loaded_instances: [{ id: "qwen3-14b" }],
              type: OutreachLmStudioModelType.Llm,
            },
          ],
        }),
      );

      const result = await outreachProviderStatusService.checkLocalLmStudio();

      expect(result).toEqual({
        running: true,
        modelLoaded: true,
        modelName: "qwen3-14b",
      });
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        `${OutreachLmStudio.NativeApiBaseUrl}/models`,
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("returns running+no-model when /v1/models responds with models but no loaded instance", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        Response.json({
          models: [
            {
              loaded_instances: [],
              type: OutreachLmStudioModelType.Llm,
            },
          ],
        }),
      );

      const result = await outreachProviderStatusService.checkLocalLmStudio();

      expect(result).toEqual({ running: true, modelLoaded: false });
    });

    it("returns not-running when the local endpoint responds with a non-ok status", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, { status: 503 }),
      );

      const result = await outreachProviderStatusService.checkLocalLmStudio();

      expect(result).toEqual({ running: false });
    });

    it("returns not-running when fetch throws a network error", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));

      const result = await outreachProviderStatusService.checkLocalLmStudio();

      expect(result).toEqual({ running: false });
    });

    it("returns not-running when the AbortController aborts (timeout)", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(
        Object.assign(new Error("The operation was aborted"), {
          name: "AbortError",
        }),
      );

      const result = await outreachProviderStatusService.checkLocalLmStudio();

      expect(result).toEqual({ running: false });
    });
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
    it("returns local running+modelLoaded and openai=true when both are available", async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(
          Response.json({
            data: [
              {
                loaded_instances: [{ id: "qwen3-14b" }],
                type: OutreachLmStudioModelType.Llm,
              },
            ],
          }),
        )
        .mockResolvedValueOnce(
          Response.json({
            ok: true,
            providers: {
              openai: { available: true, model: OutreachOpenAi.DefaultModel },
            },
          }),
        );

      const result = await checkOutreachProviders();

      expect(result).toMatchObject({
        local: { running: true, modelLoaded: true, modelName: "qwen3-14b" },
        openai: true,
      });
    });

    it("returns local running+no-model and openai=true when server has no model loaded", async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(
          Response.json({
            data: [
              {
                loaded_instances: [],
                type: OutreachLmStudioModelType.Llm,
              },
            ],
          }),
        )
        .mockResolvedValueOnce(
          Response.json({
            ok: true,
            providers: {
              openai: { available: true, model: OutreachOpenAi.DefaultModel },
            },
          }),
        );

      const result = await checkOutreachProviders();

      expect(result).toMatchObject({
        local: { running: true, modelLoaded: false },
        openai: true,
      });
    });

    it("returns local not-running and openai=true when local is down", async () => {
      vi.mocked(fetch)
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce(
          Response.json({
            ok: true,
            providers: {
              openai: { available: true, model: OutreachOpenAi.DefaultModel },
            },
          }),
        );

      const result = await checkOutreachProviders();

      expect(result).toMatchObject({ local: { running: false }, openai: true });
    });

    it("returns local not-running and openai=false when neither is available", async () => {
      vi.mocked(fetch)
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockRejectedValueOnce(new TypeError("Network error"));

      const result = await checkOutreachProviders();

      expect(result).toMatchObject({
        local: { running: false },
        openai: false,
      });
    });
  });
});
