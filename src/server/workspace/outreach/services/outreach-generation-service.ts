import "server-only";

import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { outreachAiService } from "@/server/workspace/outreach/services/outreach-ai-service";

async function generate(
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> {
  try {
    const remoteText = await outreachAiService.generate(
      systemPrompt,
      userPrompt,
    );
    if (remoteText !== null) {
      return remoteText;
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === OutreachErrorCode.ProviderUnavailable
    ) {
      throw error;
    }
    throw error;
  }

  return null;
}

export const outreachGenerationService = {
  generate,
} as const;
