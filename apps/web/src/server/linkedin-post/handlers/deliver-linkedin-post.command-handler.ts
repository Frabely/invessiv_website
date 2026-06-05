import "server-only";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type {
  DeliverLinkedInPostCommandInput,
  DeliveryTokenPayload,
  LinkedInPostDeliverCommandHandlerResult,
} from "@/common/contracts/generator";
import {
  DeliveryTokenInvalidReason,
  LINKEDIN_POST_DELIVERY_FAILED_LOG_EVENT,
  LINKEDIN_POST_DELIVERY_PERSIST_FAILED_LOG_EVENT,
  LINKEDIN_POST_GENERATOR_MAIL_FAILED_LOG_EVENT,
  LINKEDIN_POST_MAX_BODY_SIZE,
  LINKEDIN_POST_PNG_RENDER_FAILED_LOG_EVENT,
  LinkedInPostGeneratorErrorCode,
} from "@/common/constants/generator";
import type { GeneratorUsageLimitReservation } from "@invessiv/common/contracts/generator";
import { persistLinkedInPostDeliveryLead } from "@invessiv/db/contact/persist-linkedin-post-delivery";
import {
  DeliveryTokenSecretMissingError,
  linkedinPostDeliveryTokenService,
} from "@/server/linkedin-post/linkedin-post-delivery-token-service";
import { linkedinPostDeliveryRateLimitService } from "@/server/linkedin-post/linkedin-post-delivery-rate-limit-service";
import { mapLinkedInPostDeliveryToDbPersistInput } from "@/server/linkedin-post/linkedin-post-delivery-lead-mapper";
import { GeneratorUsageLimitUnavailableError } from "@/server/linkedin-post/linkedin-post-generator-usage-key-service";
import { linkedinPostDeliverRequestSchema } from "@/server/linkedin-post/linkedin-post-deliver-validation";
import { renderLinkedinPostService } from "@/server/linkedin-post/render-linkedin-post-service";
import { sendMail } from "@/server/services/mail/mail-service";
import { createLinkedInPostGeneratorResultMessage } from "@/server/services/mail/templates/linkedin-post-generator-result";
import { mapGeneratorValidationErrors } from "@/server/linkedin-post/linkedin-post-generator-validation";

function failureResult(
  code: string,
  status: HttpResponseCode,
  fieldErrors?: Record<string, string[]>,
  debug?: { reason?: string; stage: string },
): LinkedInPostDeliverCommandHandlerResult {
  return {
    body: { code, debug, fieldErrors, ok: false },
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

function invalidTokenFailure(reason: DeliveryTokenInvalidReason) {
  if (reason === DeliveryTokenInvalidReason.Expired) {
    return failureResult(
      LinkedInPostGeneratorErrorCode.DeliveryTokenExpired,
      HttpResponseCode.UnprocessableContent,
      undefined,
      { stage: "deliver_token_expired" },
    );
  }
  return failureResult(
    LinkedInPostGeneratorErrorCode.DeliveryTokenInvalid,
    HttpResponseCode.BadRequest,
    undefined,
    { stage: "deliver_token_invalid" },
  );
}

function buildContextMessage(payload: DeliveryTokenPayload) {
  return `${payload.post.kicker}: ${payload.post.headlinePlain}`;
}

async function renderDeliveryPng(payload: DeliveryTokenPayload) {
  try {
    const html = renderLinkedinPostService.renderLinkedInPostHtml(
      payload.post,
      payload.locale,
    );
    return await renderLinkedinPostService.renderLinkedInPostPng(html);
  } catch (renderError) {
    console.error(LINKEDIN_POST_PNG_RENDER_FAILED_LOG_EVENT, {
      reason: renderError instanceof Error ? renderError.message : "unknown",
      stage: "deliver_render",
      template: payload.post.template.id,
    });
    return null;
  }
}

async function persistDeliveryLead(
  payload: DeliveryTokenPayload,
  identity: { displayName: string; email: string },
  marketingConsent: boolean,
  requestId: string,
) {
  try {
    const persistInput = mapLinkedInPostDeliveryToDbPersistInput({
      contextMessage: buildContextMessage(payload),
      displayName: identity.displayName,
      email: identity.email,
      locale: payload.locale,
      marketingConsent,
      requestId,
    });
    const persistResult = await persistLinkedInPostDeliveryLead(persistInput);
    if (!persistResult.persisted) {
      console.error(LINKEDIN_POST_DELIVERY_PERSIST_FAILED_LOG_EVENT, {
        reason: "database_not_configured",
        requestId,
      });
    }
    return persistResult.persisted;
  } catch (error) {
    console.error(LINKEDIN_POST_DELIVERY_PERSIST_FAILED_LOG_EVENT, {
      reason: error instanceof Error ? error.message : "unknown",
      requestId,
    });
    return false;
  }
}

async function deliverLinkedInPostCommandHandler({
  contentLength,
  contentType,
  headers,
  requestId,
  readPayload,
}: DeliverLinkedInPostCommandInput): Promise<LinkedInPostDeliverCommandHandlerResult> {
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

  const parsed = linkedinPostDeliverRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return failureResult(
      LinkedInPostGeneratorErrorCode.ValidationError,
      HttpResponseCode.BadRequest,
      mapGeneratorValidationErrors(parsed.error),
    );
  }

  if (parsed.data.company.trim() !== "") {
    return failureResult(
      LinkedInPostGeneratorErrorCode.SpamDetected,
      HttpResponseCode.BadRequest,
    );
  }

  // Token zuerst verifizieren — invalide Tokens verbrauchen kein Rate-Budget.
  let tokenPayload: DeliveryTokenPayload;
  try {
    const verifyResult = linkedinPostDeliveryTokenService.verifyDeliveryToken(
      parsed.data.deliveryToken,
    );
    if (!verifyResult.valid) {
      return invalidTokenFailure(verifyResult.reason);
    }
    tokenPayload = verifyResult.payload;
  } catch (error) {
    if (error instanceof DeliveryTokenSecretMissingError) {
      return failureResult(
        LinkedInPostGeneratorErrorCode.DeliveryUnavailable,
        HttpResponseCode.ServiceUnavailable,
        undefined,
        { reason: error.message, stage: "deliver_secret_missing" },
      );
    }
    throw error;
  }

  let reservation: GeneratorUsageLimitReservation;
  try {
    reservation =
      await linkedinPostDeliveryRateLimitService.reserveLinkedInPostDeliveryUsage(
        headers,
      );
  } catch (error) {
    const debug =
      error instanceof GeneratorUsageLimitUnavailableError
        ? { reason: error.message, stage: "deliver_rate_limit_reserve" }
        : { stage: "deliver_rate_limit_unknown" };
    return failureResult(
      LinkedInPostGeneratorErrorCode.DeliveryUnavailable,
      HttpResponseCode.ServiceUnavailable,
      undefined,
      debug,
    );
  }

  if (!reservation.allowed) {
    return failureResult(
      LinkedInPostGeneratorErrorCode.DeliveryRateLimited,
      HttpResponseCode.TooManyRequests,
    );
  }

  try {
    const png = await renderDeliveryPng(tokenPayload);
    if (!png) {
      await linkedinPostDeliveryRateLimitService.releaseLinkedInPostDeliveryUsage(
        reservation,
      );
      return failureResult(
        LinkedInPostGeneratorErrorCode.DeliveryUnavailable,
        HttpResponseCode.ServiceUnavailable,
        undefined,
        { stage: "deliver_render" },
      );
    }

    const persisted = await persistDeliveryLead(
      tokenPayload,
      { displayName: parsed.data.displayName, email: parsed.data.email },
      parsed.data.consentMarketing,
      requestId,
    );

    if (!persisted) {
      await linkedinPostDeliveryRateLimitService.releaseLinkedInPostDeliveryUsage(
        reservation,
      );
      return failureResult(
        LinkedInPostGeneratorErrorCode.DeliveryUnavailable,
        HttpResponseCode.ServiceUnavailable,
        undefined,
        { stage: "deliver_persist" },
      );
    }

    const message = await createLinkedInPostGeneratorResultMessage({
      caption: tokenPayload.caption,
      downloadFileName: tokenPayload.downloadFileName,
      locale: tokenPayload.locale,
      post: tokenPayload.post,
      png,
      to: parsed.data.email,
    });
    const mailResult = await sendMail(message);

    if (!mailResult.ok) {
      console.error(LINKEDIN_POST_GENERATOR_MAIL_FAILED_LOG_EVENT, {
        reason: mailResult.reason,
        requestId,
        stage: "deliver_mail",
      });
      await linkedinPostDeliveryRateLimitService.releaseLinkedInPostDeliveryUsage(
        reservation,
      );
      return failureResult(
        LinkedInPostGeneratorErrorCode.DeliveryUnavailable,
        HttpResponseCode.ServiceUnavailable,
        undefined,
        { reason: mailResult.reason, stage: "deliver_mail" },
      );
    }

    return { body: { ok: true }, status: HttpResponseCode.Ok };
  } catch (error) {
    await linkedinPostDeliveryRateLimitService.releaseLinkedInPostDeliveryUsage(
      reservation,
    );
    console.error(LINKEDIN_POST_DELIVERY_FAILED_LOG_EVENT, {
      reason: error instanceof Error ? error.message : "unknown",
      requestId,
      stage: "deliver_unexpected",
    });
    return failureResult(
      LinkedInPostGeneratorErrorCode.InternalError,
      HttpResponseCode.InternalServerError,
    );
  }
}

export const deliverLinkedInPostCommandHandlerService = {
  deliverLinkedInPostCommandHandler,
} as const;
