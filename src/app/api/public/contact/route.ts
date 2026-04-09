import type { NextRequest } from "next/server";
import {
  flattenContactFieldErrors,
  contactSubmitSchema,
  type ContactSubmitInput,
} from "@/features/contact/contact.schema";
import {
  createContactErrorResponse,
  createContactSuccessResponse,
  createRequestId,
} from "@/server/http/api-response";
import { checkContactRateLimit } from "@/server/services/anti-abuse/contact-rate-limit";
import { submitContactInquiry } from "@/server/services/contact/submit-contact-inquiry";
import { submitQuickContactInquiry } from "@/server/services/contact/submit-quick-contact-inquiry";

const MAX_BODY_SIZE = 20_000;

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

async function dispatchContactSubmit(
  payload: ContactSubmitInput,
  requestId: string,
) {
  if (payload.kind === "project_request") {
    return submitContactInquiry(payload, requestId);
  }

  return submitQuickContactInquiry(payload);
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId();
  const contentType = request.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return createContactErrorResponse("invalid_json", requestId, 400);
  }

  if (!hasPayloadWithinLimit(request.headers.get("content-length"))) {
    return createContactErrorResponse("payload_too_large", requestId, 413);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return createContactErrorResponse("invalid_json", requestId, 400);
  }

  const parsedPayload = contactSubmitSchema.safeParse(payload);
  if (!parsedPayload.success) {
    const fieldErrors = flattenContactFieldErrors(parsedPayload.error.issues);
    const issueCodes = new Set(Object.values(fieldErrors).flat());
    const code = issueCodes.has("spam_detected")
      ? "spam_detected"
      : "validation_error";

    return createContactErrorResponse(code, requestId, 400, fieldErrors);
  }

  const rateLimitResult = checkContactRateLimit(
    getRateLimitIdentifier(request),
  );
  if (!rateLimitResult.allowed) {
    return createContactErrorResponse(
      "rate_limited",
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
    const submitResult = await dispatchContactSubmit(
      parsedPayload.data,
      requestId,
    );
    if (!submitResult.ok) {
      return createContactErrorResponse(submitResult.code, requestId, 503);
    }
  } catch {
    return createContactErrorResponse("internal_error", requestId, 500);
  }

  return createContactSuccessResponse(requestId);
}
