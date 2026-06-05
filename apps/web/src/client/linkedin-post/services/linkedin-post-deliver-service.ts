import type {
  DeliverLinkedInPostInput,
  LinkedInPostDeliverRequestDto,
  LinkedInPostDeliverResponseDto,
} from "@/common/contracts/generator";
import {
  WebApiEndpoint,
  LinkedInPostGeneratorErrorCode,
} from "@/common/constants";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDeliverResponse(
  value: unknown,
): value is LinkedInPostDeliverResponseDto {
  if (!isRecord(value)) {
    return false;
  }
  if (value.ok === true) {
    return true;
  }
  return value.ok === false && typeof value.code === "string";
}

async function deliverLinkedInPost(
  input: DeliverLinkedInPostInput,
  locale: Locale,
): Promise<LinkedInPostDeliverResponseDto> {
  const requestBody: LinkedInPostDeliverRequestDto = {
    company: "",
    consentDelivery: input.consentDelivery,
    consentMarketing: input.consentMarketing,
    deliveryToken: input.deliveryToken,
    displayName: input.displayName,
    email: input.email,
    locale,
  };

  const response = await fetch(WebApiEndpoint.LinkedInPostDeliver, {
    body: JSON.stringify(requestBody),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload: unknown = await response.json();
  if (isDeliverResponse(payload)) {
    return payload;
  }

  return {
    code: LinkedInPostGeneratorErrorCode.InternalError,
    ok: false,
  };
}

export const linkedinPostDeliverService = {
  deliverLinkedInPost,
} as const;
