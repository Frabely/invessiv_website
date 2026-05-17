import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OutreachLmStudio } from "@/common/ai-outreach-generation/outreach-lm-studio";
import { OutreachChatRole } from "@/common/ai-outreach-generation/outreach-message-roles";
import { generateLocalOutreachMessage } from "./lead-outreach-local-generation-service";

describe("lead-outreach-local-generation-service", () => {
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

  it("posts the selected loaded model name to LM Studio", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        choices: [
          {
            message: {
              content: "Hallo Anna, kurzer Entwurf.",
            },
          },
        ],
      }),
    );

    const result = await generateLocalOutreachMessage(
      "system prompt",
      "user prompt",
      "qwen3-14b",
    );

    expect(result).toBe("Hallo Anna, kurzer Entwurf.");
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      `${OutreachLmStudio.DefaultBaseUrl}${OutreachLmStudio.ChatCompletionsPath}`,
      expect.objectContaining({
        body: JSON.stringify({
          model: "qwen3-14b",
          messages: [
            { role: OutreachChatRole.System, content: "system prompt" },
            { role: OutreachChatRole.User, content: "user prompt" },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
  });
});
