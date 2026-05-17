import OpenAI from "openai";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { OutreachChatRole } from "@/common/ai-outreach-generation/outreach-message-roles";
import { OutreachOpenAi } from "@/common/ai-outreach-generation/outreach-lm-studio";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? OutreachOpenAi.DefaultModel;

async function generate(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(OutreachErrorCode.NotConfigured);
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: OutreachChatRole.System, content: systemPrompt },
        { role: OutreachChatRole.User, content: userPrompt },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new Error(OutreachErrorCode.ProviderUnavailable);
    }

    return text;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === OutreachErrorCode.NotConfigured
    ) {
      throw error;
    }
    throw new Error(OutreachErrorCode.ProviderUnavailable);
  }
}

export const outreachAiService = { generate };
