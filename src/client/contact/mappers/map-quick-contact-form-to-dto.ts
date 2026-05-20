import type { QuickContactFormValues } from "@invessiv/common/contracts/contact/forms/quick-contact-form-values";
import type { SaveQuickContactDto } from "@invessiv/common/contracts/contact/quick-contact/save-quick-contact-dto";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";

export function mapQuickContactFormToDto(
  values: QuickContactFormValues,
  locale: SaveQuickContactDto["locale"],
): SaveQuickContactDto {
  return {
    consentAccepted: values.consentAccepted,
    email: values.email.trim(),
    displayName: values.displayName.trim(),
    kind: CONTACT_REQUEST_KIND.QuickContact,
    locale,
    message: values.message.trim(),
  };
}
