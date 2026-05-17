"use client";

import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { OutreachChatRole } from "@/common/ai-outreach-generation/outreach-message-roles";
import { OutreachLmStudio } from "@/common/ai-outreach-generation/outreach-lm-studio";

const LOCAL_GENERATE_TIMEOUT_MS = 30000;
const CHAT_COMPLETIONS_ENDPOINT = `${OutreachLmStudio.DefaultBaseUrl}${OutreachLmStudio.ChatCompletionsPath}`;

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export async function generateLocalOutreachMessage(
  systemPrompt: string,
  userPrompt: string,
  model: string,
): Promise<string> {
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

    const response = await fetch(CHAT_COMPLETIONS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(OutreachErrorCode.ProviderUnavailable);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error(OutreachErrorCode.ProviderUnavailable);
    }

    return text;
  } finally {
    window.clearTimeout(timeout);
  }
}

export const outreachLocalGenerationService = {
  generateLocalOutreachMessage,
} as const;
