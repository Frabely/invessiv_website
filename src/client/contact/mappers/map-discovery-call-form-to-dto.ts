import type { DiscoveryCallFormValues } from "@/common/contracts/contact/forms/discovery-call-form-values";
import type { SaveDiscoveryCallDto } from "@/common/contracts/contact/discovery-call/save-discovery-call-dto";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";

export function mapDiscoveryCallFormToDto(
  values: DiscoveryCallFormValues,
  locale: SaveDiscoveryCallDto["locale"],
): SaveDiscoveryCallDto {
  const message = values.message.trim();

  return {
    consentAccepted: values.consentAccepted,
    email: values.email.trim(),
    firstName: values.firstName.trim(),
    kind: CONTACT_REQUEST_KIND.DiscoveryCall,
    lastName: values.lastName.trim(),
    locale,
    message: message || undefined,
  };
}
