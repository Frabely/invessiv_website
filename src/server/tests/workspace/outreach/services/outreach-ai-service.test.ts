import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { outreachAiService } from "@/server/workspace/outreach/services/outreach-ai-service";

const { mockLmStudioCreate, mockOpenAiCreate } = vi.hoisted(() => ({
  mockLmStudioCreate: vi.fn(),
  mockOpenAiCreate: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    private config: { apiKey: string; baseURL?: string };

    constructor(config: { apiKey: string; baseURL?: string }) {
      this.config = config;
    }

    get chat() {
      return {
        completions: {
          create: this.config.baseURL ? mockLmStudioCreate : mockOpenAiCreate,
        },
      };
    }
  },
}));

vi.mock("server-only", () => ({}));

const FAKE_TEXT = "Das ist eine generierte Outreach-Nachricht.";
let savedOpenAiApiKey: string | undefined;

function makeCompletion(text: string) {
  return { choices: [{ message: { content: text } }] };
}

beforeEach(() => {
  savedOpenAiApiKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-openai-key";
});

afterEach(() => {
  vi.clearAllMocks();
  if (savedOpenAiApiKey !== undefined) {
    process.env.OPENAI_API_KEY = savedOpenAiApiKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }
});

describe("outreachAiService.generate", () => {
  it("returns text from LM Studio when the local server is available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ data: [] })),
    );
    mockLmStudioCreate.mockResolvedValueOnce(makeCompletion(FAKE_TEXT));

    const result = await outreachAiService.generate("system", "user");

    expect(result).toBe(FAKE_TEXT);
    expect(mockLmStudioCreate).toHaveBeenCalled();
    expect(mockOpenAiCreate).not.toHaveBeenCalled();
  });

  it("falls back to OpenAI when LM Studio is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );
    mockOpenAiCreate.mockResolvedValueOnce(makeCompletion(FAKE_TEXT));

    const result = await outreachAiService.generate("system", "user");

    expect(result).toBe(FAKE_TEXT);
    expect(mockOpenAiCreate).toHaveBeenCalled();
  });

  it("calls OpenAI with system and user messages on fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );
    mockOpenAiCreate.mockResolvedValueOnce(makeCompletion(FAKE_TEXT));

    await outreachAiService.generate("my-system", "my-user");

    expect(mockOpenAiCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system", content: "my-system" }),
          expect.objectContaining({ role: "user", content: "my-user" }),
        ]),
      }),
    );
  });

  it("throws NOT_CONFIGURED when neither LM Studio nor OpenAI are available", async () => {
    delete process.env.OPENAI_API_KEY;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );

    await expect(outreachAiService.generate("system", "user")).rejects.toThrow(
      OutreachErrorCode.NotConfigured,
    );
  });

  it("throws PROVIDER_UNAVAILABLE when OpenAI rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );
    mockOpenAiCreate.mockRejectedValueOnce(new Error("openai_error"));

    await expect(outreachAiService.generate("system", "user")).rejects.toThrow(
      OutreachErrorCode.ProviderUnavailable,
    );
  });
});
