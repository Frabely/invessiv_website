import type {
  LinkedInPostGeneratorFailureResponseDto,
  LinkedInPostGeneratorSuccessResponseDto,
} from "@/common/contracts/generator";
import type { LinkedInPostGeneratorFormValues } from "@invessiv/common/contracts/generator/linkedin-post-generator-form-values";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";

/**
 * Extends the shared DTO with web-app-specific rendering fields that are
 * returned by the API but intentionally excluded from the shared contract
 * (they are implementation details of the iframe preview and PNG download,
 * not part of the general API surface).
 */
export type LinkedInPostGeneratorSuccessResult =
  LinkedInPostGeneratorSuccessResponseDto & {
    previewHtml: string;
    imageDataUrl: string | null;
  };

export type LinkedInPostGeneratorResult =
  | LinkedInPostGeneratorSuccessResult
  | LinkedInPostGeneratorFailureResponseDto;

const GENERATOR_ENDPOINT = "/api/public/generator/linkedin-post";

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
    (typeof value.imageDataUrl === "string" || value.imageDataUrl === null)
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

export async function submitLinkedInPostGenerator(
  values: LinkedInPostGeneratorFormValues,
  locale: Locale,
): Promise<LinkedInPostGeneratorResult> {
  const response = await fetch(GENERATOR_ENDPOINT, {
    body: JSON.stringify({ ...values, locale }),
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
    code: "internal_error",
    ok: false,
  };
}
