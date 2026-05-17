import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { outreachAiService } from "@/server/workspace/outreach/services/outreach-ai-service";

const { mockOpenAiCreate } = vi.hoisted(() => ({
  mockOpenAiCreate: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    get chat() {
      return {
        completions: {
          create: mockOpenAiCreate,
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
  it("calls OpenAI with system and user messages", async () => {
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

  it("returns the generated text from OpenAI", async () => {
    mockOpenAiCreate.mockResolvedValueOnce(makeCompletion(FAKE_TEXT));

    const result = await outreachAiService.generate("system", "user");

    expect(result).toBe(FAKE_TEXT);
  });

  it("throws NOT_CONFIGURED when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(outreachAiService.generate("system", "user")).rejects.toThrow(
      OutreachErrorCode.NotConfigured,
    );
    expect(mockOpenAiCreate).not.toHaveBeenCalled();
  });

  it("throws PROVIDER_UNAVAILABLE when OpenAI rejects", async () => {
    mockOpenAiCreate.mockRejectedValueOnce(new Error("openai_error"));

    await expect(outreachAiService.generate("system", "user")).rejects.toThrow(
      OutreachErrorCode.ProviderUnavailable,
    );
  });

  it("throws PROVIDER_UNAVAILABLE when OpenAI returns empty content", async () => {
    mockOpenAiCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "" } }],
    });

    await expect(outreachAiService.generate("system", "user")).rejects.toThrow(
      OutreachErrorCode.ProviderUnavailable,
    );
  });
});
