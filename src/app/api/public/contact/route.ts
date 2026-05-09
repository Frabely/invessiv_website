import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  CONTACT_REQUEST_KIND,
  CONTACT_REQUEST_KINDS,
} from "@/common/constants/contact/contact-request-kind";
import { CONTACT_SUBMIT_ERROR_CODE } from "@/common/contracts/contact/submit/contact-submit-error-code";
import { submitDiscoveryCallCommandHandler } from "@/server/contact/handlers/submit-discovery-call.command-handler";
import {
  createContactErrorResponse,
  createContactSuccessResponse,
} from "@/server/contact/response-builder-service";
import { submitProjectRequestCommandHandler } from "@/server/contact/handlers/submit-project-request.command-handler";
import { submitQuickContactCommandHandler } from "@/server/contact/handlers/submit-quick-contact.command-handler";
import { checkContactRateLimit } from "@/server/services/anti-abuse/contact-rate-limit-service";

const MAX_BODY_SIZE = 20_000;
const contactRequestKindSchema = z.object({
  kind: z.enum(CONTACT_REQUEST_KINDS),
});

export const runtime = "nodejs";

function getRateLimitIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "anonymous";
  }

  return request.headers.get("x-real-ip") ?? "anonymous";
}

function hasPayloadWithinLimit(contentLength: string | null) {
  if (!contentLength) {
    return true;
  }

  const numericLength = Number(contentLength);
  return Number.isFinite(numericLength) && numericLength <= MAX_BODY_SIZE;
}

async function dispatchContactSubmit(payload: unknown, requestId: string) {
  const parsedKind = contactRequestKindSchema.safeParse(payload);
  if (!parsedKind.success) {
    return {
      code: CONTACT_SUBMIT_ERROR_CODE.ValidationError,
      fieldErrors: {
        kind: ["invalid_request_kind"],
      },
      ok: false as const,
    };
  }

  if (parsedKind.data.kind === CONTACT_REQUEST_KIND.ProjectRequest) {
    return submitProjectRequestCommandHandler(payload, requestId);
  }

  if (parsedKind.data.kind === CONTACT_REQUEST_KIND.QuickContact) {
    return submitQuickContactCommandHandler(payload, requestId);
  }

  return submitDiscoveryCallCommandHandler(payload, requestId);
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const contentType = request.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return createContactErrorResponse(
      CONTACT_SUBMIT_ERROR_CODE.InvalidJson,
      requestId,
      400,
    );
  }

  if (!hasPayloadWithinLimit(request.headers.get("content-length"))) {
    return createContactErrorResponse(
      CONTACT_SUBMIT_ERROR_CODE.PayloadTooLarge,
      requestId,
      413,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return createContactErrorResponse(
      CONTACT_SUBMIT_ERROR_CODE.InvalidJson,
      requestId,
      400,
    );
  }

  const rateLimitResult = checkContactRateLimit(
    getRateLimitIdentifier(request),
  );
  if (!rateLimitResult.allowed) {
    return createContactErrorResponse(
      CONTACT_SUBMIT_ERROR_CODE.RateLimited,
      requestId,
      429,
      undefined,
      {
        "Retry-After": String(
          Math.max(1, Math.ceil(rateLimitResult.retryAfterMs / 1000)),
        ),
      },
    );
  }

  try {
    const submitResult = await dispatchContactSubmit(payload, requestId);
    if (!submitResult.ok) {
      const status =
        submitResult.code === CONTACT_SUBMIT_ERROR_CODE.ValidationError ||
        submitResult.code === CONTACT_SUBMIT_ERROR_CODE.SpamDetected
          ? 400
          : 503;

      return createContactErrorResponse(
        submitResult.code,
        requestId,
        status,
        submitResult.fieldErrors,
      );
    }
  } catch {
    return createContactErrorResponse(
      CONTACT_SUBMIT_ERROR_CODE.InternalError,
      requestId,
      500,
    );
  }

  return createContactSuccessResponse(requestId);
}
