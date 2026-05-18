import "server-only";

import OpenAI from "openai";
import { OutreachChatRole } from "@/common/constants/leads/outreach/lead-outreach-message-roles";
import { OutreachErrorCode } from "@/common/constants/leads/outreach/lead-outreach-error-codes";
import { OutreachOpenAi } from "@/common/constants/leads/outreach/lead-outreach-openai";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? OutreachOpenAi.DefaultModel;

async function generate(
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const client = new OpenAI({ apiKey });

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: OutreachChatRole.System, content: systemPrompt },
        { role: OutreachChatRole.User, content: userPrompt },
      ],
    });
    const text = response.choices[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
      return null;
    }

    return text;
  } catch {
    throw new Error(OutreachErrorCode.ProviderUnavailable);
  }
}

export const outreachAiService = { generate };
