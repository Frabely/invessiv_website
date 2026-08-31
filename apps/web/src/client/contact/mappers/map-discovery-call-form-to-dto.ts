import type { ContactFormValues } from "@invessiv/common/contracts/contact/forms/contact-form-values";
import type { SaveDiscoveryCallDto } from "@invessiv/common/contracts/contact/discovery-call/save-discovery-call-dto";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import type { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";

export function mapDiscoveryCallFormToDto(
  values: ContactFormValues,
  locale: SaveDiscoveryCallDto["locale"],
  origin: ContactSubmissionOrigin,
): SaveDiscoveryCallDto {
  const message = values.message.trim();

  return {
    consentAccepted: values.consentAccepted,
    email: values.email.trim(),
    displayName: values.displayName.trim(),
    kind: CONTACT_REQUEST_KIND.DiscoveryCall,
    locale,
    message: message || undefined,
    origin,
    projectScope: values.projectScope ?? undefined,
  };
}
