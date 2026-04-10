import type { QuickContactDto } from "@/features/contact/client/quick-contact.dto";
import type { QuickContactFormValues } from "@/features/contact/client/quick-contact-form.schema";

export function mapQuickContactFormToDto(
  values: QuickContactFormValues,
  locale: QuickContactDto["locale"],
): QuickContactDto {
  return {
    consentAccepted: values.consentAccepted,
    email: values.email.trim(),
    firstName: values.firstName.trim(),
    kind: "quick_contact",
    lastName: values.lastName.trim(),
    locale,
    message: values.message.trim(),
  };
}
