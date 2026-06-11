import "server-only";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { LinkedInPostGeneratorErrorStage } from "@invessiv/common/constants/generator";
import { LinkedInPostGeneratorErrorCode } from "@/common/constants/generator";
import { LinkedInPostGenerationError } from "@/server/linkedin-post/services/generation/linkedin-post-openai-adapter-service";

export type LinkedInPostGeneratorErrorLogContext = {
  reason?: string;
  stage: string;
};

export type MappedLinkedInPostGeneratorError = {
  code: LinkedInPostGeneratorErrorCode;
  logContext: LinkedInPostGeneratorErrorLogContext;
};

/**
 * Maps a thrown generation error to a stable public error code plus an
 * internal log context. The log context (reason, stage) is for server logs
 * only and must never be included in public API responses.
 */
function mapGenerationError(error: unknown): MappedLinkedInPostGeneratorError {
  if (error instanceof LinkedInPostGenerationError) {
    return {
      code: error.code,
      logContext: {
        reason: error.message,
        stage: error.stage,
      },
    };
  }

  if (error instanceof Error) {
    return {
      code: LinkedInPostGeneratorErrorCode.InternalError,
      logContext: {
        reason: error.message,
        stage: LinkedInPostGeneratorErrorStage.RouteUnexpected,
      },
    };
  }

  return {
    code: LinkedInPostGeneratorErrorCode.InternalError,
    logContext: {
      stage: LinkedInPostGeneratorErrorStage.RouteUnknown,
    },
  };
}

function statusForGenerationError(
  code: LinkedInPostGeneratorErrorCode,
): HttpResponseCode {
  if (code === LinkedInPostGeneratorErrorCode.UnsafeInput) {
    return HttpResponseCode.BadRequest;
  }

  if (
    code === LinkedInPostGeneratorErrorCode.OpenAiInvalidContent ||
    code === LinkedInPostGeneratorErrorCode.OpenAiInvalidJson
  ) {
    return HttpResponseCode.UnprocessableContent;
  }

  if (
    code === LinkedInPostGeneratorErrorCode.UsageLimitUnavailable ||
    code === LinkedInPostGeneratorErrorCode.OpenAiApiKeyMissing ||
    code === LinkedInPostGeneratorErrorCode.OpenAiRequestFailed ||
    code === LinkedInPostGeneratorErrorCode.OpenAiSchemaError ||
    code === LinkedInPostGeneratorErrorCode.OpenAiEmptyOutput ||
    code === LinkedInPostGeneratorErrorCode.GeneratorSchemaInvalid ||
    code === LinkedInPostGeneratorErrorCode.ImageRenderFailed
  ) {
    return HttpResponseCode.ServiceUnavailable;
  }

  return HttpResponseCode.InternalServerError;
}

export const linkedinPostGeneratorErrorService = {
  mapGenerationError,
  statusForGenerationError,
} as const;
