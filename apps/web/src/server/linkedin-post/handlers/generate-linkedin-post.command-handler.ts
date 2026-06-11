import "server-only";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { LinkedInPostGeneratorErrorStage } from "@invessiv/common/constants/generator";
import type {
  LinkedInPostGeneratorFailureResponseDto,
  LinkedInPostGeneratorSuccessResponseDto,
} from "@/common/contracts/generator";
import type { LinkedInPostGeneratorRequestDto } from "@/common/contracts/generator/api/linkedin-post-generator-request";
import {
  LINKEDIN_POST_GENERATOR_FAILED_LOG_EVENT,
  LINKEDIN_POST_MAX_BODY_SIZE,
  LINKEDIN_POST_PNG_RENDER_FAILED_LOG_EVENT,
  LinkedInPostGeneratorErrorCode,
} from "@/common/constants/generator";
import { BoundedJsonBodyResultKind } from "@/common/constants/http/bounded-json-body-result-kind";
import { boundedJsonBodyService } from "@/server/http/bounded-json-body-service";
import { linkedinPostGeneratorErrorService } from "@/server/linkedin-post/errors/linkedin-post-generator-error";
import { linkedinPostGeneratorService } from "@/server/linkedin-post/services/generation/linkedin-post-generator-service";
import { linkedinPostGeneratorMockService } from "@/server/linkedin-post/services/generation/linkedin-post-generator-mock-service";
import { linkedinPostGeneratorUsageLimitService } from "@/server/linkedin-post/services/usage-limit/linkedin-post-generator-usage-limit-service";
import { GeneratorUsageLimitUnavailableError } from "@/server/linkedin-post/services/usage-limit/linkedin-post-generator-usage-key-service";
import {
  linkedinPostGeneratorRequestSchema,
  linkedinPostGeneratorValidationService,
} from "@/server/linkedin-post/validation/linkedin-post-generator-validation";
import { linkedinPostRenderService } from "@/server/linkedin-post/services/rendering/linkedin-post-render-service";

type LinkedInPostGeneratorCommandSuccessResponse =
  LinkedInPostGeneratorSuccessResponseDto & {
    imageDataUrl: string;
    previewHtml: string;
  };

export type LinkedInPostGeneratorCommandHandlerResult = {
  body:
    | LinkedInPostGeneratorCommandSuccessResponse
    | LinkedInPostGeneratorFailureResponseDto;
  status: HttpResponseCode;
};

export type GenerateLinkedInPostCommandInput = {
  bodyStream: ReadableStream<Uint8Array> | null;
  contentLength: string | null;
  contentType: string | null;
  headers: Headers;
};

function failureResult(
  code: string,
  status: HttpResponseCode,
  fieldErrors?: Record<string, string[]>,
  usageLimit?: LinkedInPostGeneratorFailureResponseDto["usageLimit"],
): LinkedInPostGeneratorCommandHandlerResult {
  return {
    body: {
      code,
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

function shouldUseLinkedInPostGeneratorMock() {
  return process.env.LINKEDIN_POST_GENERATOR_USE_MOCK === "true";
}

async function generateLinkedInPostCommandHandler({
  bodyStream,
  contentLength,
  contentType,
  headers,
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

  const bodyResult = await boundedJsonBodyService.readBoundedJsonBody(
    bodyStream,
    LINKEDIN_POST_MAX_BODY_SIZE,
  );

  if (bodyResult.kind === BoundedJsonBodyResultKind.PayloadTooLarge) {
    return failureResult(
      LinkedInPostGeneratorErrorCode.PayloadTooLarge,
      HttpResponseCode.PayloadTooLarge,
    );
  }

  if (bodyResult.kind === BoundedJsonBodyResultKind.InvalidJson) {
    return failureResult(
      LinkedInPostGeneratorErrorCode.InvalidJson,
      HttpResponseCode.BadRequest,
    );
  }

  const parsedPayload = linkedinPostGeneratorRequestSchema.safeParse(
    bodyResult.payload,
  );
  if (!parsedPayload.success) {
    return failureResult(
      LinkedInPostGeneratorErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
      linkedinPostGeneratorValidationService.mapGeneratorValidationErrors(
        parsedPayload.error,
      ),
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
    const logContext =
      error instanceof GeneratorUsageLimitUnavailableError
        ? {
            reason: error.message,
            stage: LinkedInPostGeneratorErrorStage.UsageLimitReserve,
          }
        : { stage: LinkedInPostGeneratorErrorStage.UsageLimitUnknown };

    console.error(LINKEDIN_POST_GENERATOR_FAILED_LOG_EVENT, {
      code: LinkedInPostGeneratorErrorCode.UsageLimitUnavailable,
      ...logContext,
    });

    return failureResult(
      LinkedInPostGeneratorErrorCode.UsageLimitUnavailable,
      HttpResponseCode.ServiceUnavailable,
    );
  }

  if (!usageReservation.allowed) {
    return failureResult(
      LinkedInPostGeneratorErrorCode.UsageLimitReached,
      HttpResponseCode.TooManyRequests,
      undefined,
      linkedinPostGeneratorUsageLimitService.toUsageLimitSnapshot(
        usageReservation,
      ),
    );
  }

  try {
    const result = await (shouldUseLinkedInPostGeneratorMock()
      ? linkedinPostGeneratorMockService.buildMockLinkedInPostGeneratorSuccessResult(
          generatorRequest,
          generatorRequest.locale,
        )
      : linkedinPostGeneratorService.generateLinkedInPost(generatorRequest));

    let png: Buffer;
    try {
      png = await linkedinPostRenderService.renderLinkedInPostPng(result.post);
    } catch (renderError) {
      await linkedinPostGeneratorUsageLimitService.releaseLinkedInPostGeneratorUsage(
        usageReservation,
      );
      console.error(LINKEDIN_POST_PNG_RENDER_FAILED_LOG_EVENT, {
        reason: renderError instanceof Error ? renderError.message : "unknown",
        stage: "svg_render",
        template: result.post.template.id,
      });
      return failureResult(
        LinkedInPostGeneratorErrorCode.ImageRenderFailed,
        HttpResponseCode.ServiceUnavailable,
      );
    }
    const imageDataUrl = `data:image/png;base64,${png.toString("base64")}`;

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
    const { code, logContext } =
      linkedinPostGeneratorErrorService.mapGenerationError(error);

    console.error(LINKEDIN_POST_GENERATOR_FAILED_LOG_EVENT, {
      code,
      reason: logContext.reason,
      stage: logContext.stage,
    });

    return failureResult(
      code,
      linkedinPostGeneratorErrorService.statusForGenerationError(code),
    );
  }
}

export const generateLinkedInPostCommandHandlerService = {
  generateLinkedInPostCommandHandler,
} as const;
