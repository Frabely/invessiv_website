import type {
  LinkedInPostGeneratorFailureResponseDto,
  LinkedInPostGeneratorSuccessResponseDto,
} from "@/common/contracts/generator";
import type { LinkedInPostGeneratorFormValues } from "@/common/contracts/generator/ui/linkedin-post-generator-form-values";
import {
  LinkedInPostGeneratorErrorCode,
  WebApiEndpoint,
} from "@/common/constants";
import type { LinkedInPostGeneratorRequestDto } from "@/common/contracts/generator/api/linkedin-post-generator-request";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";

/**
 * Extends the shared DTO with web-app-specific rendering fields that are
 * returned by the API but intentionally excluded from the shared contract
 * (they are implementation details of the iframe preview and ZIP download,
 * not part of the general API surface).
 */
export type LinkedInPostGeneratorSuccessResult =
  LinkedInPostGeneratorSuccessResponseDto & {
    previewHtml: string;
    imageDataUrl: string;
  };

export type LinkedInPostGeneratorResult =
  | LinkedInPostGeneratorSuccessResult
  | LinkedInPostGeneratorFailureResponseDto;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLinkedInPostGeneratorSuccessResult(
  value: unknown,
): value is LinkedInPostGeneratorSuccessResult {
  if (!isRecord(value) || value.ok !== true) {
    return false;
  }

  return (
    typeof value.caption === "string" &&
    typeof value.downloadFileName === "string" &&
    isRecord(value.post) &&
    typeof value.imageDataUrl === "string"
  );
}

function isLinkedInPostGeneratorFailureResponse(
  value: unknown,
): value is LinkedInPostGeneratorFailureResponseDto {
  if (!isRecord(value) || value.ok !== false) {
    return false;
  }

  return typeof value.code === "string";
}

function isGeneratorResult(
  value: unknown,
): value is LinkedInPostGeneratorResult {
  return (
    isLinkedInPostGeneratorSuccessResult(value) ||
    isLinkedInPostGeneratorFailureResponse(value)
  );
}

async function submitLinkedInPost(
  values: LinkedInPostGeneratorFormValues,
  locale: Locale,
): Promise<LinkedInPostGeneratorResult> {
  const requestBody: LinkedInPostGeneratorRequestDto = {
    colorPairId: values.colorPairId,
    company: values.company,
    consent: values.consent,
    displayName: values.displayName,
    email: values.email,
    expertise: values.expertise,
    locale,
    tone: values.tone,
    topic: values.topic,
  };

  const response = await fetch(WebApiEndpoint.LinkedInPostGenerate, {
    body: JSON.stringify(requestBody),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload: unknown = await response.json();
  if (isGeneratorResult(payload)) {
    return payload;
  }

  return {
    code: LinkedInPostGeneratorErrorCode.InternalError,
    ok: false,
  };
}

export const linkedinPostGeneratorService = {
  submitLinkedInPost,
} as const;
