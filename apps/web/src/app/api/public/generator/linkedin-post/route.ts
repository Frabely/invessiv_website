import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { LinkedInPostGenerationError } from "@/server/linkedin-post/linkedin-post-openai-adapter-service";
import { generateLinkedInPost } from "@/server/linkedin-post/linkedin-post-generator-service";
import { renderLinkedinPostService } from "@/server/linkedin-post/render-linkedin-post-service";
import { sendMail } from "@/server/services/mail/mail-service";
import { createLinkedInPostGeneratorResultMessage } from "@/server/services/mail/templates/linkedin-post-generator-result";
import {
  linkedinPostGeneratorRequestSchema,
  mapGeneratorValidationErrors,
} from "@/server/linkedin-post/linkedin-post-generator-validation";
import type { LinkedInPostGeneratorFailureResponseDto } from "@/common/contracts/generator";
import {
  LINKEDIN_POST_GENERATOR_FAILED_LOG_EVENT,
  LINKEDIN_POST_GENERATOR_MAIL_FAILED_LOG_EVENT,
  LINKEDIN_POST_MAX_BODY_SIZE,
  LINKEDIN_POST_PNG_RENDER_FAILED_LOG_EVENT,
  LinkedInPostGeneratorErrorCode,
} from "@/common/constants/generator";

export const runtime = "nodejs";
export const maxDuration = 60;

function errorResponse(
  code: string,
  status: HttpResponseCode,
  fieldErrors?: Record<string, string[]>,
  debug?: { reason?: string; stage: string },
) {
  const body: LinkedInPostGeneratorFailureResponseDto = {
    code,
    debug,
    fieldErrors,
    ok: false,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
    },
    status,
  });
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

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return errorResponse(
      LinkedInPostGeneratorErrorCode.InvalidJson,
      HttpResponseCode.BadRequest,
    );
  }

  if (!hasPayloadWithinLimit(request.headers.get("content-length"))) {
    return errorResponse(
      LinkedInPostGeneratorErrorCode.PayloadTooLarge,
      HttpResponseCode.PayloadTooLarge,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(
      LinkedInPostGeneratorErrorCode.InvalidJson,
      HttpResponseCode.BadRequest,
    );
  }

  const parsedPayload = linkedinPostGeneratorRequestSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return errorResponse(
      LinkedInPostGeneratorErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
      mapGeneratorValidationErrors(parsedPayload.error),
    );
  }

  if (parsedPayload.data.company.trim() !== "") {
    return errorResponse(
      LinkedInPostGeneratorErrorCode.SpamDetected,
      HttpResponseCode.BadRequest,
    );
  }

  try {
    const result = await generateLinkedInPost(parsedPayload.data);

    let png: Buffer | null = null;
    try {
      png = await renderLinkedinPostService.renderLinkedInPostPng(
        result.previewHtml,
      );
    } catch (renderError) {
      // PNG render is best-effort: the response remains 200 and the mail falls
      // back to an SVG attachment. Log a structured event so this is observable
      // in log-based monitoring even when HTTP metrics show no errors.
      console.error(LINKEDIN_POST_PNG_RENDER_FAILED_LOG_EVENT, {
        reason: renderError instanceof Error ? renderError.message : "unknown",
        stage: "playwright_render",
        template: result.post.template.id,
      });
    }
    const imageDataUrl = png
      ? `data:image/png;base64,${png.toString("base64")}`
      : null;

    const message = await createLinkedInPostGeneratorResultMessage({
      caption: result.caption,
      downloadFileName: result.downloadFileName,
      locale: parsedPayload.data.locale,
      png,
      post: result.post,
      to: parsedPayload.data.email,
    });
    const mailResult = await sendMail(message);
    if (!mailResult.ok) {
      console.error(LINKEDIN_POST_GENERATOR_MAIL_FAILED_LOG_EVENT, {
        reason: mailResult.reason,
      });
    }

    return NextResponse.json(
      { ...result, imageDataUrl },
      {
        headers: {
          "Cache-Control": "no-store",
        },
        status: HttpResponseCode.Ok,
      },
    );
  } catch (error) {
    const { code, debug } = mapGenerationError(error);

    console.error(LINKEDIN_POST_GENERATOR_FAILED_LOG_EVENT, {
      code,
      reason: debug.reason,
      stage: debug.stage,
    });

    return errorResponse(
      code,
      statusForGenerationError(code),
      undefined,
      debug,
    );
  }
}
