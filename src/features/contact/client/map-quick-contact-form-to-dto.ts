import type { QuickContactDto } from "@/features/contact/client/quick-contact.dto";
import type { QuickContactFormValues } from "@/features/contact/client/quick-contact-form.schema";

export function mapQuickContactFormToDto(
  values: QuickContactFormValues,
): QuickContactDto {
  return {
    consentAccepted: values.consentAccepted,
    email: values.email.trim(),
    fullName: values.fullName.trim(),
    message: values.message.trim(),
  };
}
