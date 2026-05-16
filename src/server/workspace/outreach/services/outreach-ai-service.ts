import OpenAI from "openai";
import { OutreachLmStudio } from "@/common/ai-outreach-generation/outreach-lm-studio";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const LM_STUDIO_MODEL =
  process.env.LM_STUDIO_MODEL ?? OutreachLmStudio.DefaultModel;
const LM_STUDIO_BASE_URL =
  process.env.LM_STUDIO_BASE_URL ?? OutreachLmStudio.DefaultBaseUrl;
const LM_STUDIO_AVAILABLE_TIMEOUT_MS = 1200;

async function callOpenAi(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(OutreachErrorCode.ProviderUnavailable);
    }

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
  } catch {
    throw new Error(OutreachErrorCode.ProviderUnavailable);
  }
}

async function isLmStudioAvailable(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    LM_STUDIO_AVAILABLE_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${LM_STUDIO_BASE_URL}/models`, {
      method: "GET",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function callLmStudio(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const client = new OpenAI({
    apiKey: "lm-studio",
    baseURL: LM_STUDIO_BASE_URL,
  });

  const response = await client.chat.completions.create({
    model: LM_STUDIO_MODEL,
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
}

async function generate(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const lmStudioAvailable = await isLmStudioAvailable();
  if (lmStudioAvailable) {
    try {
      return await callLmStudio(systemPrompt, userPrompt);
    } catch {
      // Fall through to OpenAI if local generation fails.
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(OutreachErrorCode.NotConfigured);
  }

  try {
    return await callOpenAi(systemPrompt, userPrompt);
  } catch {
    throw new Error(OutreachErrorCode.ProviderUnavailable);
  }
}

export const outreachAiService = { generate };
