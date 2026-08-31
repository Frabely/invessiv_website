import type { ContactFormValues } from "@invessiv/common/contracts/contact/forms/contact-form-values";
import type { SaveQuickContactDto } from "@invessiv/common/contracts/contact/quick-contact/save-quick-contact-dto";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";

export function mapQuickContactFormToDto(
  values: ContactFormValues,
  locale: SaveQuickContactDto["locale"],
  message: string,
): SaveQuickContactDto {
  return {
    consentAccepted: values.consentAccepted,
    email: values.email.trim(),
    displayName: values.displayName.trim(),
    kind: CONTACT_REQUEST_KIND.QuickContact,
    locale,
    message: message.trim(),
  };
}
