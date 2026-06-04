import "server-only";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { LinkedInPostGeneratorErrorStage } from "@invessiv/common/constants/generator";
import type {
  LinkedInPostGeneratorFailureResponseDto,
  LinkedInPostGeneratorSuccessResponseDto,
} from "@/common/contracts/generator";
import type { LinkedInPostGeneratorRequestDto } from "@/common/contracts/generator/linkedin-post-generator-request";
import {
  LINKEDIN_POST_GENERATOR_FAILED_LOG_EVENT,
  LINKEDIN_POST_GENERATOR_MAIL_FAILED_LOG_EVENT,
  LINKEDIN_POST_MAX_BODY_SIZE,
  LINKEDIN_POST_PNG_RENDER_FAILED_LOG_EVENT,
  LinkedInPostGeneratorErrorCode,
} from "@/common/constants/generator";
import { LinkedInPostGenerationError } from "@/server/linkedin-post/linkedin-post-openai-adapter-service";
import { generateLinkedInPost } from "@/server/linkedin-post/linkedin-post-generator-service";
import { linkedinPostGeneratorMockService } from "@/server/linkedin-post/linkedin-post-generator-mock-service";
import {
  GeneratorUsageLimitUnavailableError,
  linkedinPostGeneratorUsageLimitService,
} from "@/server/linkedin-post/linkedin-post-generator-usage-limit-service";
import {
  linkedinPostGeneratorRequestSchema,
  mapGeneratorValidationErrors,
} from "@/server/linkedin-post/linkedin-post-generator-validation";
import { renderLinkedinPostService } from "@/server/linkedin-post/render-linkedin-post-service";
import { sendMail } from "@/server/services/mail/mail-service";
import { createLinkedInPostGeneratorResultMessage } from "@/server/services/mail/templates/linkedin-post-generator-result";

type LinkedInPostGeneratorCommandSuccessResponse =
  LinkedInPostGeneratorSuccessResponseDto & {
    imageDataUrl: string | null;
    previewHtml: string;
  };

export type LinkedInPostGeneratorCommandHandlerResult = {
  body:
    | LinkedInPostGeneratorCommandSuccessResponse
    | LinkedInPostGeneratorFailureResponseDto;
  status: HttpResponseCode;
};

export type GenerateLinkedInPostCommandInput = {
  contentLength: string | null;
  contentType: string | null;
  headers: Headers;
  readPayload: () => Promise<unknown>;
};

function failureResult(
  code: string,
  status: HttpResponseCode,
  fieldErrors?: Record<string, string[]>,
  debug?: { reason?: string; stage: string },
  usageLimit?: LinkedInPostGeneratorFailureResponseDto["usageLimit"],
): LinkedInPostGeneratorCommandHandlerResult {
  return {
    body: {
      code,
      debug,
      fieldErrors,
      ok: false,
      usageLimit,
    },
    status,
  };
}

function hasPayloadWithinLimit(contentLength: string | null) {
  if (!contentLength) {
    return true;
  }

  const numericLength = Number(contentLength);
  return (
    Number.isFinite(numericLength) &&
    numericLength <= LINKEDIN_POST_MAX_BODY_SIZE
  );
}

function mapGenerationError(error: unknown) {
  if (error instanceof LinkedInPostGenerationError) {
    return {
      code: error.code,
      debug: {
        reason: error.message,
        stage: error.stage,
      },
    };
  }

  if (error instanceof Error) {
    return {
      code: LinkedInPostGeneratorErrorCode.InternalError,
      debug: {
        reason: error.message,
        stage: "route_unexpected",
      },
    };
  }

  return {
    code: LinkedInPostGeneratorErrorCode.InternalError,
    debug: {
      stage: "route_unknown",
    },
  };
}

function statusForGenerationError(code: LinkedInPostGeneratorErrorCode) {
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
    code === LinkedInPostGeneratorErrorCode.GeneratorSchemaInvalid
  ) {
    return HttpResponseCode.ServiceUnavailable;
  }

  return HttpResponseCode.InternalServerError;
}

async function sendOptionalResultMail(
  generatorRequest: LinkedInPostGeneratorRequestDto,
  result: LinkedInPostGeneratorSuccessResponseDto,
  png: Buffer | null,
) {
  if (generatorRequest.email.trim() === "") {
    return;
  }

  const message = await createLinkedInPostGeneratorResultMessage({
    caption: result.caption,
    downloadFileName: result.downloadFileName,
    locale: generatorRequest.locale,
    png,
    post: result.post,
    to: generatorRequest.email,
  });
  const mailResult = await sendMail(message);
  if (!mailResult.ok) {
    console.error(LINKEDIN_POST_GENERATOR_MAIL_FAILED_LOG_EVENT, {
      reason: mailResult.reason,
    });
  }
}

async function generateLinkedInPostCommandHandler({
  contentLength,
  contentType,
  headers,
  readPayload,
}: GenerateLinkedInPostCommandInput): Promise<LinkedInPostGeneratorCommandHandlerResult> {
  if (!contentType?.includes("application/json")) {
    return failureResult(
      LinkedInPostGeneratorErrorCode.InvalidJson,
      HttpResponseCode.BadRequest,
    );
  }

  if (!hasPayloadWithinLimit(contentLength)) {
    return failureResult(
      LinkedInPostGeneratorErrorCode.PayloadTooLarge,
      HttpResponseCode.PayloadTooLarge,
    );
  }

  let payload: unknown;
  try {
    payload = await readPayload();
  } catch {
    return failureResult(
      LinkedInPostGeneratorErrorCode.InvalidJson,
      HttpResponseCode.BadRequest,
    );
  }

  const parsedPayload = linkedinPostGeneratorRequestSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return failureResult(
      LinkedInPostGeneratorErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
      mapGeneratorValidationErrors(parsedPayload.error),
    );
  }

  const generatorRequest: LinkedInPostGeneratorRequestDto = parsedPayload.data;

  if (parsedPayload.data.company.trim() !== "") {
    return failureResult(
      LinkedInPostGeneratorErrorCode.SpamDetected,
      HttpResponseCode.BadRequest,
    );
  }

  let usageReservation: Awaited<
    ReturnType<
      typeof linkedinPostGeneratorUsageLimitService.reserveLinkedInPostGeneratorUsage
    >
  >;
  try {
    usageReservation =
      await linkedinPostGeneratorUsageLimitService.reserveLinkedInPostGeneratorUsage(
        headers,
      );
  } catch (error) {
    const debug =
      error instanceof GeneratorUsageLimitUnavailableError
        ? {
            reason: error.message,
            stage: LinkedInPostGeneratorErrorStage.UsageLimitReserve,
          }
        : { stage: LinkedInPostGeneratorErrorStage.UsageLimitUnknown };

    return failureResult(
      LinkedInPostGeneratorErrorCode.UsageLimitUnavailable,
      HttpResponseCode.ServiceUnavailable,
      undefined,
      debug,
    );
  }

  if (!usageReservation.allowed) {
    return failureResult(
      LinkedInPostGeneratorErrorCode.UsageLimitReached,
      HttpResponseCode.TooManyRequests,
      undefined,
      undefined,
      linkedinPostGeneratorUsageLimitService.toUsageLimitSnapshot(
        usageReservation,
      ),
    );
  }

  try {
    const result = await (process.env
      .NEXT_PUBLIC_LINKEDIN_POST_GENERATOR_USE_MOCK !== "false"
      ? linkedinPostGeneratorMockService.buildMockLinkedInPostGeneratorSuccessResult(
          generatorRequest,
          generatorRequest.locale,
        )
      : generateLinkedInPost(generatorRequest));

    let png: Buffer | null = null;
    try {
      png = await renderLinkedinPostService.renderLinkedInPostPng(
        result.previewHtml,
      );
    } catch (renderError) {
      console.error(LINKEDIN_POST_PNG_RENDER_FAILED_LOG_EVENT, {
        reason: renderError instanceof Error ? renderError.message : "unknown",
        stage: "playwright_render",
        template: result.post.template.id,
      });
    }
    const imageDataUrl = png
      ? `data:image/png;base64,${png.toString("base64")}`
      : null;

    await sendOptionalResultMail(generatorRequest, result, png);

    return {
      body: {
        ...result,
        imageDataUrl,
        usageLimit:
          linkedinPostGeneratorUsageLimitService.toUsageLimitSnapshot(
            usageReservation,
          ),
      },
      status: HttpResponseCode.Ok,
    };
  } catch (error) {
    await linkedinPostGeneratorUsageLimitService.releaseLinkedInPostGeneratorUsage(
      usageReservation,
    );
    const { code, debug } = mapGenerationError(error);

    console.error(LINKEDIN_POST_GENERATOR_FAILED_LOG_EVENT, {
      code,
      reason: debug.reason,
      stage: debug.stage,
    });

    return failureResult(
      code,
      statusForGenerationError(code),
      undefined,
      debug,
    );
  }
}

export const generateLinkedInPostCommandHandlerService = {
  generateLinkedInPostCommandHandler,
} as const;
