import "server-only";

import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { outreachAiService } from "@/server/workspace/outreach/services/outreach-ai-service";
import { outreachLocalGenerationService } from "@/server/workspace/outreach/services/outreach-local-generation-service";

async function generate(
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> {
  try {
    const localText = await outreachLocalGenerationService.generate(
      systemPrompt,
      userPrompt,
    );
    if (localText !== null) {
      return localText;
    }
  } catch {
    // Fallback to the server provider below.
  }

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
