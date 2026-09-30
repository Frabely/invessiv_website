import { ONBOARDING_CONFIRMED_VALUE } from "../../../constants/crm/onboarding/onboarding-confirmed-value";
import { OnboardingFieldType } from "../../../constants/crm/onboarding/onboarding-field-types";
import { ONBOARDING_LIMITS } from "../../../constants/crm/onboarding/onboarding-limits";
import { OnboardingValueErrorCode } from "../../../constants/crm/onboarding/onboarding-value-error-codes";
import type { OnboardingFieldDto } from "../../../contracts/crm/onboarding/onboarding-field.dto";
import type { OnboardingValueValidationResult } from "../../../contracts/crm/onboarding/onboarding-value-validation-result";
import { CONTACT_EMAIL_PATTERN } from "../../contact/contact-email";
import { isValidContactPhone } from "../../contact/contact-phone";
import { CONTACT_URL_PATTERN } from "../../contact/contact-url";

type ValueField = Pick<OnboardingFieldDto, "type" | "maxLength">;

const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const SCALE_STEP_PATTERN = /^[1-9][0-9]*$/;

const OK: OnboardingValueValidationResult = { ok: true };

function fail(code: OnboardingValueErrorCode): OnboardingValueValidationResult {
  return { ok: false, code };
}

/** Length cap for a free-text value; null for types whose format already bounds the value. */
export function getOnboardingValueMaxLength(field: ValueField): number | null {
  switch (field.type) {
    case OnboardingFieldType.ShortText:
      return field.maxLength ?? ONBOARDING_LIMITS.shortTextDefaultMaxLength;
    case OnboardingFieldType.LongText:
      return field.maxLength ?? ONBOARDING_LIMITS.longTextDefaultMaxLength;
    case OnboardingFieldType.Email:
    case OnboardingFieldType.Phone:
    case OnboardingFieldType.Url:
      return ONBOARDING_LIMITS.shortTextDefaultMaxLength;
    default:
      return null;
  }
}

function isScaleStep(value: string): boolean {
  if (!SCALE_STEP_PATTERN.test(value)) return false;
  return Number(value) <= ONBOARDING_LIMITS.scaleSteps;
}

/**
 * Validates one raw value before it is stored in `onboarding_answers.value`. Shared by the request
 * schemas on the server and the field components on the client, so both reject the same input.
 * An empty value is never stored: the caller deletes the answer row instead.
 */
export function validateOnboardingValue(
  field: ValueField,
  raw: string,
): OnboardingValueValidationResult {
  const value = raw.trim();
  const maxLength = getOnboardingValueMaxLength(field);

  switch (field.type) {
    case OnboardingFieldType.ShortText:
    case OnboardingFieldType.LongText:
    case OnboardingFieldType.Email:
    case OnboardingFieldType.Phone:
    case OnboardingFieldType.Url:
    case OnboardingFieldType.Color:
    case OnboardingFieldType.Scale:
    case OnboardingFieldType.Confirmation:
      break;
    default:
      return fail(OnboardingValueErrorCode.NotAValueField);
  }
  if (!value) return fail(OnboardingValueErrorCode.Empty);
  if (maxLength !== null && raw.length > maxLength)
    return fail(OnboardingValueErrorCode.TooLong);

  switch (field.type) {
    case OnboardingFieldType.Email:
      return CONTACT_EMAIL_PATTERN.test(value)
        ? OK
        : fail(OnboardingValueErrorCode.InvalidEmail);
    case OnboardingFieldType.Phone:
      return isValidContactPhone(value)
        ? OK
        : fail(OnboardingValueErrorCode.InvalidPhone);
    case OnboardingFieldType.Url:
      return CONTACT_URL_PATTERN.test(value)
        ? OK
        : fail(OnboardingValueErrorCode.InvalidUrl);
    case OnboardingFieldType.Color:
      return COLOR_PATTERN.test(raw)
        ? OK
        : fail(OnboardingValueErrorCode.InvalidColor);
    case OnboardingFieldType.Scale:
      return isScaleStep(raw)
        ? OK
        : fail(OnboardingValueErrorCode.InvalidScale);
    case OnboardingFieldType.Confirmation:
      return raw === ONBOARDING_CONFIRMED_VALUE
        ? OK
        : fail(OnboardingValueErrorCode.NotConfirmed);
    default:
      return OK;
  }
}
