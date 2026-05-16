import OpenAI from "openai";

const LM_STUDIO_BASE_URL =
  process.env.LMSTUDIO_BASE_URL ?? "http://localhost:1234/v1";
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL ?? "qwen3-14b";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

async function callLmStudio(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const client = new OpenAI({
    baseURL: LM_STUDIO_BASE_URL,
    apiKey: "lm-studio",
  });
  const response = await client.chat.completions.create({
    model: LM_STUDIO_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("empty_lmstudio_response");
  return text;
}

async function callOpenAi(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("no_openai_key");
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("empty_openai_response");
  return text;
}

async function generate(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  try {
    return await callLmStudio(systemPrompt, userPrompt);
  } catch {
    try {
      return await callOpenAi(systemPrompt, userPrompt);
    } catch {
      throw new Error("PROVIDER_UNAVAILABLE");
    }
  }
}

export const outreachAiService = { generate };
