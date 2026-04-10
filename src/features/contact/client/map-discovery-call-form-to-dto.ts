import type { DiscoveryCallDto } from "@/features/contact/client/discovery-call.dto";
import type { DiscoveryCallFormValues } from "@/features/contact/client/discovery-call-form.schema";

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
