import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";

export type MapFinalCtaFormToDtoOptions = {
  locale: Locale;
  origin: ContactSubmissionOrigin;
  payloadContext: string;
};
