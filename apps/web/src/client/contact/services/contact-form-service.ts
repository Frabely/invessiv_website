import type { ContactSubmitResponse } from "@invessiv/common/contracts/contact/submit/contact-submit";
import {
  CONTACT_SUBMIT_ERROR_CODE,
  type ContactSubmitErrorCode,
} from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import type { BaseContactFieldsValues } from "@invessiv/common/contracts/contact/fields/base-contact-fields-values";
import type { SaveDiscoveryCallDto } from "@invessiv/common/contracts/contact/discovery-call/save-discovery-call-dto";
import type { CalendlyPrefillOptions } from "@invessiv/common/contracts/contact/options/calendly-prefill-options";
import type { ContactSubmitOptions } from "@invessiv/common/contracts/contact/options/contact-submit-options";
import type { SaveProjectRequestDto } from "@invessiv/common/contracts/contact/project-request/save-project-request-dto";
import type { SaveQuickContactDto } from "@invessiv/common/contracts/contact/quick-contact/save-quick-contact-dto";
import { ContactSearchParam } from "@invessiv/common/constants/contact/contact-search-params";
import { WebApiEndpoint } from "@/common/constants";

function createClientErrorResponse(
  code: ContactSubmitErrorCode = CONTACT_SUBMIT_ERROR_CODE.InternalError,
): ContactSubmitResponse {
  return {
    code,
    ok: false,
    requestId: "client_error",
  };
}

function isContactSubmitResponse(
  value: unknown,
): value is ContactSubmitResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<ContactSubmitResponse>;
  return (
    typeof payload.ok === "boolean" && typeof payload.requestId === "string"
  );
}

export async function submitProjectRequest(
  dto: SaveProjectRequestDto,
  options?: ContactSubmitOptions,
): Promise<ContactSubmitResponse> {
  return submitContact(dto, options);
}

async function submitContact(
  dto: SaveProjectRequestDto | SaveQuickContactDto | SaveDiscoveryCallDto,
  { submitPath = WebApiEndpoint.ContactSubmit }: ContactSubmitOptions = {},
): Promise<ContactSubmitResponse> {
  try {
    const response = await fetch(submitPath, {
      body: JSON.stringify(dto),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return createClientErrorResponse();
    }

    return isContactSubmitResponse(payload)
      ? payload
      : createClientErrorResponse();
  } catch {
    return createClientErrorResponse();
  }
}

export function submitQuickContact(
  dto: SaveQuickContactDto,
  options?: ContactSubmitOptions,
) {
  return submitContact(dto, options);
}

export function submitDiscoveryCall(
  dto: SaveDiscoveryCallDto,
  options?: ContactSubmitOptions,
) {
  return submitContact(dto, options);
}

export function createCalendlyPrefillHref(
  values: BaseContactFieldsValues,
  {
    calendlyUrl,
    concernAnswerSlot = 1,
    projectScopeAnswerSlot = 2,
    projectScopeLabel,
  }: CalendlyPrefillOptions,
) {
  const url = new URL(calendlyUrl);
  const normalizedName = values.displayName.trim();
  const normalizedEmail = values.email.trim();
  const normalizedConcern = values.message.trim();
  const normalizedProjectScope = projectScopeLabel?.trim() ?? "";

  url.searchParams.set(ContactSearchParam.Name, normalizedName);
  url.searchParams.set(ContactSearchParam.Email, normalizedEmail);

  if (normalizedConcern) {
    url.searchParams.set(`a${concernAnswerSlot}`, normalizedConcern);
  } else {
    url.searchParams.delete(`a${concernAnswerSlot}`);
  }

  if (normalizedProjectScope) {
    url.searchParams.set(`a${projectScopeAnswerSlot}`, normalizedProjectScope);
  } else {
    url.searchParams.delete(`a${projectScopeAnswerSlot}`);
  }

  return url.toString();
}
