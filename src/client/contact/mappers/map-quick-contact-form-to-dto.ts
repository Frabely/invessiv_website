import type { QuickContactFormValues } from "@/common/contracts/contact/forms/quick-contact-form-values";
import type { SaveQuickContactDto } from "@/common/contracts/contact/quick-contact/save-quick-contact-dto";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";

export function mapQuickContactFormToDto(
  values: QuickContactFormValues,
  locale: SaveQuickContactDto["locale"],
): SaveQuickContactDto {
  return {
    consentAccepted: values.consentAccepted,
    email: values.email.trim(),
    firstName: values.firstName.trim(),
    kind: CONTACT_REQUEST_KIND.QuickContact,
    lastName: values.lastName.trim(),
    locale,
    message: values.message.trim(),
  };
}
