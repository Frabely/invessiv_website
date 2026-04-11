import type { DiscoveryCallFormValues } from "@/common/contracts/contact/forms/discovery-call-form-values";
import type { SaveDiscoveryCallDto } from "@/common/contracts/contact/discovery-call/save-discovery-call-dto";

export function mapDiscoveryCallFormToDto(
  values: DiscoveryCallFormValues,
  locale: SaveDiscoveryCallDto["locale"],
): SaveDiscoveryCallDto {
  const message = values.message.trim();

  return {
    consentAccepted: values.consentAccepted,
    email: values.email.trim(),
    firstName: values.firstName.trim(),
    kind: "discovery_call",
    lastName: values.lastName.trim(),
    locale,
    message: message || undefined,
  };
}
