import { CONTACT_EMAIL_PATTERN } from "@invessiv/common/patterns/contact/contact-email";
import { isValidContactPhone } from "@invessiv/common/patterns/contact/contact-phone";

function isValidEmail(value: string): boolean {
  return CONTACT_EMAIL_PATTERN.test(value.trim());
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidPhone(value: string): boolean {
  return isValidContactPhone(value.trim());
}

export const formValidationService = {
  isValidEmail,
  isValidHttpUrl,
  isValidPhone,
} as const;
