import "server-only";

import { OutreachChatRole } from "@/common/ai-outreach-generation/outreach-message-roles";
import { OutreachLmStudio } from "@/common/ai-outreach-generation/outreach-lm-studio";

const LOCAL_GENERATE_TIMEOUT_MS = 30000;

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

async function generate(
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    LOCAL_GENERATE_TIMEOUT_MS,
  );

  try {
    const response = await fetch(OutreachLmStudio.ChatCompletionsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OutreachLmStudio.DefaultModel,
        messages: [
          { role: OutreachChatRole.System, content: systemPrompt },
          { role: OutreachChatRole.User, content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
      return null;
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export const outreachLocalGenerationService = {
  generate,
} as const;
