import OpenAI from "openai";
import { OutreachChatRole } from "@/common/ai-outreach-generation/outreach-message-roles";
import { OutreachOpenAi } from "@/common/ai-outreach-generation/outreach-lm-studio";

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
  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: OutreachChatRole.System, content: systemPrompt },
      { role: OutreachChatRole.User, content: userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim();
  if (!text) {
    return null;
  }

  return text;
}

export const outreachAiService = { generate };
