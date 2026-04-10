import type {
  ContactSubmitErrorCode,
  ContactSubmitResponse,
} from "@/features/contact/contact.contract";
import type { BaseContactFieldsValues } from "@/features/contact/client/base-contact-fields";
import type { ProjectRequestDto } from "@/features/contact/client/project-request.dto";
import type { QuickContactDto } from "@/features/contact/client/quick-contact.dto";

export const DEFAULT_CONTACT_SUBMIT_PATH = "/api/public/contact";

type SubmitProjectRequestOptions = {
  submitPath?: string;
};

type OpenQuickContactMailDraftOptions = {
  channelValue: string;
  emailLabel: string;
  firstNameLabel: string;
  intro: string;
  lastNameLabel: string;
  subject: string;
};

type CalendlyPrefillOptions = {
  calendlyUrl: string;
  concernAnswerSlot?: number;
};

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
  {
    submitPath = DEFAULT_CONTACT_SUBMIT_PATH,
  }: SubmitProjectRequestOptions = {},
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

export function createQuickContactMailtoHref(
  dto: QuickContactDto,
  {
    channelValue,
    emailLabel,
    firstNameLabel,
    intro,
    lastNameLabel,
    subject,
  }: OpenQuickContactMailDraftOptions,
) {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(
    `${intro}\n\n${firstNameLabel}: ${dto.firstName}\n${lastNameLabel}: ${dto.lastName}\n${emailLabel}: ${dto.email}\n\n${dto.message}`,
  );

  return `mailto:${channelValue}?subject=${encodedSubject}&body=${encodedBody}`;
}

export function openQuickContactMailDraft(
  dto: QuickContactDto,
  options: OpenQuickContactMailDraftOptions,
) {
  const mailtoHref = createQuickContactMailtoHref(dto, options);
  const link = document.createElement("a");
  link.href = mailtoHref;
  link.click();
  return mailtoHref;
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
