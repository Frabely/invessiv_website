import type { QuickContactDto } from "@/common/contracts/contact/dtos/quick-contact-dto";
import type { QuickContactFormValues } from "@/common/contracts/contact/forms/quick-contact-form-values";

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
