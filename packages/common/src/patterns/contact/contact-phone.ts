import { LeadFieldLimits } from "@invessiv/common/constants/leads/forms/lead-field-limits";

const CONTACT_PHONE_ALLOWED_PATTERN = /^[+0-9\s()./-]+$/;

export function isValidContactPhone(phone: string): boolean {
  const normalizedPhone = phone.trim();

  if (
    normalizedPhone.length < 5 ||
    normalizedPhone.length > LeadFieldLimits.PhoneMaxLength
  ) {
    return false;
  }

  if (!CONTACT_PHONE_ALLOWED_PATTERN.test(normalizedPhone)) {
    return false;
  }

  return normalizedPhone.replace(/\D/g, "").length >= 6;
}
