"use client";

import type { GenerateOutreachRequestDto } from "@/common/ai-outreach-generation/generate-outreach-request.dto";
import type { GenerateOutreachResultDto } from "@/common/ai-outreach-generation/generate-outreach-result.dto";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";

const GENERATE_ENDPOINT = "/api/workspace/outreach/generate";

type ApiResult<T> = {
  payload: T | null;
  response: Response | null;
};

function isGenerateResult(value: unknown): value is GenerateOutreachResultDto {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof (value as { ok?: unknown }).ok === "boolean"
  );
}

async function readJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(input, init);
    const payload = await readJson<T>(response);
    return { payload, response };
  } catch {
    return { payload: null, response: null };
  }
}

export async function generateOutreachMessage(
  payload: GenerateOutreachRequestDto,
): Promise<GenerateOutreachResultDto> {
  const result = await fetchJson<GenerateOutreachResultDto>(GENERATE_ENDPOINT, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (result.response?.ok && isGenerateResult(result.payload)) {
    return result.payload;
  }

  if (
    result.payload &&
    typeof result.payload === "object" &&
    "error" in result.payload &&
    typeof (result.payload as { error?: unknown }).error === "string"
  ) {
    return {
      ok: false,
      code: (result.payload as { error: OutreachErrorCode }).error,
    };
  }

  return { ok: false, code: OutreachErrorCode.Internal };
}

export const outreachGenerationClientService = {
  generateOutreachMessage,
} as const;
