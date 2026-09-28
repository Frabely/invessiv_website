import { CONTACT_EMAIL_PATTERN } from "@invessiv/common/patterns/contact/contact-email";
import { isValidContactPhone } from "@invessiv/common/patterns/contact/contact-phone";
import { isHttpUrl } from "@invessiv/common/patterns/url/parse-http-url";

function isValidEmail(value: string): boolean {
  return CONTACT_EMAIL_PATTERN.test(value.trim());
}

function isValidHttpUrl(value: string): boolean {
  return isHttpUrl(value.trim());
}

function isValidPhone(value: string): boolean {
  return isValidContactPhone(value.trim());
}

export const formValidationService = {
  isValidEmail,
  isValidHttpUrl,
  isValidPhone,
} as const;
