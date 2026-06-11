import { describe, expect, it, vi } from "vitest";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { LinkedInPostGeneratorErrorStage } from "@invessiv/common/constants/generator";
import { LinkedInPostGeneratorErrorCode } from "@/common/constants/generator";
import { LinkedInPostGenerationError } from "@/server/linkedin-post/services/generation/linkedin-post-openai-adapter-service";
import { linkedinPostGeneratorErrorService } from "./linkedin-post-generator-error";

vi.mock("server-only", () => ({}));

vi.mock(
  "@/server/linkedin-post/services/generation/linkedin-post-openai-adapter-service",
  () => ({
    LinkedInPostGenerationError: class LinkedInPostGenerationError extends Error {
      constructor(
        readonly code: string,
        readonly stage: string,
        message: string,
      ) {
        super(message);
        this.name = "LinkedInPostGenerationError";
      }
    },
  }),
);

describe("linkedinPostGeneratorErrorService.mapGenerationError", () => {
  it("keeps code, stage and reason from a generation error in the log context", () => {
    const mapped = linkedinPostGeneratorErrorService.mapGenerationError(
      new LinkedInPostGenerationError(
        LinkedInPostGeneratorErrorCode.OpenAiInvalidContent,
        "openai_quality_gate",
        "caption.hashtags:linkedin_hashtag_must_be_last",
      ),
    );

    expect(mapped).toEqual({
      code: LinkedInPostGeneratorErrorCode.OpenAiInvalidContent,
      logContext: {
        reason: "caption.hashtags:linkedin_hashtag_must_be_last",
        stage: "openai_quality_gate",
      },
    });
  });

  it("maps unexpected errors to internal_error with the route stage", () => {
    const mapped = linkedinPostGeneratorErrorService.mapGenerationError(
      new Error("provider exploded"),
    );

    expect(mapped).toEqual({
      code: LinkedInPostGeneratorErrorCode.InternalError,
      logContext: {
        reason: "provider exploded",
        stage: LinkedInPostGeneratorErrorStage.RouteUnexpected,
      },
    });
  });

  it("maps non-error throwables to internal_error without a reason", () => {
    const mapped = linkedinPostGeneratorErrorService.mapGenerationError("boom");

    expect(mapped).toEqual({
      code: LinkedInPostGeneratorErrorCode.InternalError,
      logContext: {
        stage: LinkedInPostGeneratorErrorStage.RouteUnknown,
      },
    });
  });
});

describe("linkedinPostGeneratorErrorService.statusForGenerationError", () => {
  it("maps unsafe input to 400", () => {
    expect(
      linkedinPostGeneratorErrorService.statusForGenerationError(
        LinkedInPostGeneratorErrorCode.UnsafeInput,
      ),
    ).toBe(HttpResponseCode.BadRequest);
  });

  it("maps invalid provider content to 422", () => {
    expect(
      linkedinPostGeneratorErrorService.statusForGenerationError(
        LinkedInPostGeneratorErrorCode.OpenAiInvalidContent,
      ),
    ).toBe(HttpResponseCode.UnprocessableContent);
    expect(
      linkedinPostGeneratorErrorService.statusForGenerationError(
        LinkedInPostGeneratorErrorCode.OpenAiInvalidJson,
      ),
    ).toBe(HttpResponseCode.UnprocessableContent);
  });

  it("maps provider and limit availability problems to 503", () => {
    const serviceUnavailableCodes = [
      LinkedInPostGeneratorErrorCode.UsageLimitUnavailable,
      LinkedInPostGeneratorErrorCode.OpenAiApiKeyMissing,
      LinkedInPostGeneratorErrorCode.OpenAiRequestFailed,
      LinkedInPostGeneratorErrorCode.OpenAiSchemaError,
      LinkedInPostGeneratorErrorCode.OpenAiEmptyOutput,
      LinkedInPostGeneratorErrorCode.GeneratorSchemaInvalid,
    ];

    for (const code of serviceUnavailableCodes) {
      expect(
        linkedinPostGeneratorErrorService.statusForGenerationError(code),
      ).toBe(HttpResponseCode.ServiceUnavailable);
    }
  });

  it("falls back to 500 for unmapped codes", () => {
    expect(
      linkedinPostGeneratorErrorService.statusForGenerationError(
        LinkedInPostGeneratorErrorCode.InternalError,
      ),
    ).toBe(HttpResponseCode.InternalServerError);
  });
});
