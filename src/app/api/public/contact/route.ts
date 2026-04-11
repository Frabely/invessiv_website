import type { NextRequest } from "next/server";
import { z } from "zod";
import type {
  DiscoveryCallSubmitRequest,
  ProjectRequestSubmitRequest,
  QuickContactSubmitRequest,
} from "@/common/contracts/contact/submit/contact-submit";
import { CONTACT_REQUEST_KINDS } from "@/common/constants/contact/contact-request-kind";
import { submitDiscoveryCallCommandHandler } from "@/server/contact/handlers/submit-discovery-call.command-handler";
import {
  createContactErrorResponse,
  createContactSuccessResponse,
  createRequestId,
} from "@/server/http/api-response";
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
      code: "validation_error" as const,
      fieldErrors: {
        kind: ["invalid_request_kind"],
      },
      ok: false as const,
    };
  }

  if (parsedKind.data.kind === "project_request") {
    return submitProjectRequestCommandHandler(
      payload as ProjectRequestSubmitRequest,
      requestId,
    );
  }

  if (parsedKind.data.kind === "quick_contact") {
    return submitQuickContactCommandHandler(
      payload as QuickContactSubmitRequest,
      requestId,
    );
  }

  return submitDiscoveryCallCommandHandler(
    payload as DiscoveryCallSubmitRequest,
    requestId,
  );
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
    const submitResult = await dispatchContactSubmit(payload, requestId);
    if (!submitResult.ok) {
      const status =
        submitResult.code === "validation_error" ||
        submitResult.code === "spam_detected"
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
    return createContactErrorResponse("internal_error", requestId, 500);
  }

  return createContactSuccessResponse(requestId);
}
