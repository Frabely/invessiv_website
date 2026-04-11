import type { QuickContactFormValues } from "@/common/contracts/contact/forms/quick-contact-form-values";
import type { SaveQuickContactDto } from "@/common/contracts/contact/quick-contact/save-quick-contact-dto";

export function mapQuickContactFormToDto(
  values: QuickContactFormValues,
  locale: SaveQuickContactDto["locale"],
): SaveQuickContactDto {
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
