"use client";

import { OutreachLmStudio } from "@/common/ai-outreach-generation/outreach-lm-studio";

const LOCAL_GENERATE_TIMEOUT_MS = 30000;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

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
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await fetch(
      `${OutreachLmStudio.DefaultBaseUrl}/chat/completions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error("local-unavailable");
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("local-unavailable");
    }

    return text;
  } catch (error) {
    if (error instanceof Error && error.message === "local-unavailable") {
      throw error;
    }
    throw new Error("local-unavailable");
  } finally {
    window.clearTimeout(timeout);
  }
}

export const outreachLocalGenerationService = {
  generateLocalOutreachMessage,
} as const;
