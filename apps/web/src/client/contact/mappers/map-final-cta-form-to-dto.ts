import type { FinalCtaFormValues } from "@invessiv/common/contracts/contact/forms/final-cta-form-values";
import type { MapFinalCtaFormToDtoOptions } from "@invessiv/common/contracts/contact/options/map-final-cta-form-to-dto-options";
import type { SaveQuickContactDto } from "@invessiv/common/contracts/contact/quick-contact/save-quick-contact-dto";
import { CONTACT_FORM_FIELD_NAME } from "@invessiv/common/constants/contact/contact-form-field-names";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";

function buildFinalCtaMessage(
  goal: string,
  website: string,
  payloadContext: string,
): string {
  const trimmedContext = payloadContext.trim();
  const trimmedWebsite = website.trim();
  const trimmedGoal = goal.trim();
  const messageParts = trimmedContext ? [trimmedContext] : [];

  if (trimmedWebsite) {
    messageParts.push(`Website: ${trimmedWebsite}`);
  }

  messageParts.push(trimmedGoal);
  return messageParts.join("\n\n");
}

export function mapFinalCtaFormToDto(
  values: FinalCtaFormValues,
  { locale, origin, payloadContext }: MapFinalCtaFormToDtoOptions,
): SaveQuickContactDto {
  return {
    consentAccepted: values[CONTACT_FORM_FIELD_NAME.ConsentAccepted],
    displayName: values.name.trim(),
    email: values.email.trim(),
    kind: CONTACT_REQUEST_KIND.QuickContact,
    locale,
    message: buildFinalCtaMessage(
      values[CONTACT_FORM_FIELD_NAME.Goal],
      values[CONTACT_FORM_FIELD_NAME.Website],
      payloadContext,
    ),
    origin,
  };
}
