import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { outreachAiService } from "@/server/workspace/outreach/services/outreach-ai-service";

const { mockLmStudioCreate, mockOpenAiCreate } = vi.hoisted(() => ({
  mockLmStudioCreate: vi.fn(),
  mockOpenAiCreate: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    private config: { apiKey: string };

    constructor(config: { apiKey: string }) {
      this.config = config;
    }

    get chat() {
      return {
        completions: {
          create:
            this.config.apiKey === "lm-studio"
              ? mockLmStudioCreate
              : mockOpenAiCreate,
        },
      };
    }
  },
}));

vi.mock("server-only", () => ({}));

const FAKE_TEXT = "Das ist eine generierte Outreach-Nachricht.";
let savedApiKey: string | undefined;

function makeCompletion(text: string) {
  return { choices: [{ message: { content: text } }] };
}

beforeEach(() => {
  savedApiKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-openai-key";
});

afterEach(() => {
  vi.clearAllMocks();
  if (savedApiKey !== undefined) {
    process.env.OPENAI_API_KEY = savedApiKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }
});

describe("outreachAiService.generate — LM Studio primary path", () => {
  it("returns text from LM Studio when it succeeds", async () => {
    mockLmStudioCreate.mockResolvedValueOnce(makeCompletion(FAKE_TEXT));
    const result = await outreachAiService.generate("system", "user");
    expect(result).toBe(FAKE_TEXT);
  });

  it("calls LM Studio with system and user messages", async () => {
    mockLmStudioCreate.mockResolvedValueOnce(makeCompletion(FAKE_TEXT));
    await outreachAiService.generate("my-system", "my-user");
    expect(mockLmStudioCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system", content: "my-system" }),
          expect.objectContaining({ role: "user", content: "my-user" }),
        ]),
      }),
    );
  });

  it("does not call OpenAI when LM Studio succeeds", async () => {
    mockLmStudioCreate.mockResolvedValueOnce(makeCompletion(FAKE_TEXT));
    await outreachAiService.generate("system", "user");
    expect(mockOpenAiCreate).not.toHaveBeenCalled();
  });
});

describe("outreachAiService.generate — OpenAI fallback path", () => {
  it("falls back to OpenAI when LM Studio throws", async () => {
    mockLmStudioCreate.mockRejectedValueOnce(
      new Error("ECONNREFUSED — LM Studio not running"),
    );
    mockOpenAiCreate.mockResolvedValueOnce(makeCompletion(FAKE_TEXT));
    const result = await outreachAiService.generate("system", "user");
    expect(result).toBe(FAKE_TEXT);
  });

  it("calls OpenAI with system and user messages on fallback", async () => {
    mockLmStudioCreate.mockRejectedValueOnce(new Error("timeout"));
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
});

describe("outreachAiService.generate — PROVIDER_UNAVAILABLE", () => {
  it("throws PROVIDER_UNAVAILABLE when both LM Studio and OpenAI fail", async () => {
    mockLmStudioCreate.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    mockOpenAiCreate.mockRejectedValueOnce(new Error("openai_error"));
    await expect(outreachAiService.generate("system", "user")).rejects.toThrow(
      "PROVIDER_UNAVAILABLE",
    );
  });

  it("throws PROVIDER_UNAVAILABLE when LM Studio fails and OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;
    mockLmStudioCreate.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await expect(outreachAiService.generate("system", "user")).rejects.toThrow(
      "PROVIDER_UNAVAILABLE",
    );
  });
});
