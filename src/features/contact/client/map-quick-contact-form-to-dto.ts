import type { QuickContactDto } from "@/features/contact/client/quick-contact.dto";
import type { QuickContactFormValues } from "@/features/contact/client/quick-contact-form.schema";

export function mapQuickContactFormToDto(
  values: QuickContactFormValues,
  locale: QuickContactDto["locale"],
): QuickContactDto {
  return {
    consentAccepted: values.consentAccepted,
    email: values.email.trim(),
    fullName: values.fullName.trim(),
    kind: "quick_contact",
    locale,
    message: values.message.trim(),
  };
}
