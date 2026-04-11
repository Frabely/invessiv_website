import type {
  ContactSubmitErrorCode,
  ContactSubmitResponse,
} from "@/common/contracts/contact/submit/contact-submit";
import type { BaseContactFieldsValues } from "@/common/contracts/contact/fields/base-contact-fields-values";
import type { DiscoveryCallDto } from "@/common/contracts/contact/dtos/discovery-call-dto";
import type { ProjectRequestDto } from "@/common/contracts/contact/dtos/project-request-dto";
import type { QuickContactDto } from "@/common/contracts/contact/dtos/quick-contact-dto";
import type { CalendlyPrefillOptions } from "@/common/contracts/contact/options/calendly-prefill-options";
import type { ContactSubmitOptions } from "@/common/contracts/contact/options/contact-submit-options";
import { DEFAULT_CONTACT_SUBMIT_PATH } from "@/common/constants/contact/contact-submit-path";

function createClientErrorResponse(
  code: ContactSubmitErrorCode = "internal_error",
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
  dto: ProjectRequestDto,
  options?: ContactSubmitOptions,
): Promise<ContactSubmitResponse> {
  return submitContact(dto, options);
}

async function submitContact(
  dto: ProjectRequestDto | QuickContactDto | DiscoveryCallDto,
  { submitPath = DEFAULT_CONTACT_SUBMIT_PATH }: ContactSubmitOptions = {},
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
  dto: QuickContactDto,
  options?: ContactSubmitOptions,
) {
  return submitContact(dto, options);
}

export function submitDiscoveryCall(
  dto: DiscoveryCallDto,
  options?: ContactSubmitOptions,
) {
  return submitContact(dto, options);
}

export function createCalendlyPrefillHref(
  values: BaseContactFieldsValues,
  { calendlyUrl, concernAnswerSlot = 1 }: CalendlyPrefillOptions,
) {
  const url = new URL(calendlyUrl);
  const normalizedName =
    `${values.firstName.trim()} ${values.lastName.trim()}`.trim();
  const normalizedEmail = values.email.trim();
  const normalizedConcern = values.message.trim();

  url.searchParams.set("name", normalizedName);
  url.searchParams.set("email", normalizedEmail);

  if (normalizedConcern) {
    url.searchParams.set(`a${concernAnswerSlot}`, normalizedConcern);
  } else {
    url.searchParams.delete(`a${concernAnswerSlot}`);
  }

  return url.toString();
}
