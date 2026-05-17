"use client";

import { OutreachChatRole } from "@/common/ai-outreach-generation/outreach-message-roles";
import { OutreachLmStudio } from "@/common/ai-outreach-generation/outreach-lm-studio";

const LOCAL_GENERATE_TIMEOUT_MS = 30000;

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

async function generateLocalOutreachMessage(
  systemPrompt: string,
  userPrompt: string,
  model: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    LOCAL_GENERATE_TIMEOUT_MS,
  );

  try {
    const messages = [
      { role: OutreachChatRole.System, content: systemPrompt },
      { role: OutreachChatRole.User, content: userPrompt },
    ];

    const response = await fetch(OutreachLmStudio.ChatCompletionsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return null;
    }

    return text;
  } finally {
    window.clearTimeout(timeout);
  }
}

export const outreachLocalGenerationService = {
  generateLocalOutreachMessage,
} as const;
