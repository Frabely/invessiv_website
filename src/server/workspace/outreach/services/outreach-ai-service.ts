import OpenAI from "openai";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

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
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
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
