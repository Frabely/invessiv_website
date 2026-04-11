import type { DiscoveryCallDto } from "@/common/contracts/contact/dtos/discovery-call-dto";
import type { DiscoveryCallFormValues } from "@/common/contracts/contact/forms/discovery-call-form-values";

export function mapDiscoveryCallFormToDto(
  values: DiscoveryCallFormValues,
  locale: DiscoveryCallDto["locale"],
): DiscoveryCallDto {
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
