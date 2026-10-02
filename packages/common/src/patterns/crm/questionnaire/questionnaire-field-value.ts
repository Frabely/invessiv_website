import { QUESTIONNAIRE_CONFIRMED_VALUE } from "../../../constants/crm/questionnaire/questionnaire-confirmed-value";
import { QuestionnaireFieldType } from "../../../constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "../../../constants/crm/questionnaire/questionnaire-limits";
import { QuestionnaireValueErrorCode } from "../../../constants/crm/questionnaire/questionnaire-value-error-codes";
import type { QuestionnaireFieldDto } from "../../../contracts/crm/questionnaire/questionnaire-field.dto";
import type { QuestionnaireValueValidationResult } from "../../../contracts/crm/questionnaire/questionnaire-value-validation-result";
import { CONTACT_EMAIL_PATTERN } from "../../contact/contact-email";
import { isValidContactPhone } from "../../contact/contact-phone";
import { CONTACT_URL_PATTERN } from "../../contact/contact-url";

type ValueField = Pick<QuestionnaireFieldDto, "type" | "maxLength">;

const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const SCALE_STEP_PATTERN = /^[1-9][0-9]*$/;

const OK: QuestionnaireValueValidationResult = { ok: true };

function fail(
  code: QuestionnaireValueErrorCode,
): QuestionnaireValueValidationResult {
  return { ok: false, code };
}

/** Length cap for a free-text value; null for types whose format already bounds the value. */
export function getQuestionnaireValueMaxLength(
  field: ValueField,
): number | null {
  switch (field.type) {
    case QuestionnaireFieldType.ShortText:
      return field.maxLength ?? QUESTIONNAIRE_LIMITS.shortTextDefaultMaxLength;
    case QuestionnaireFieldType.LongText:
      return field.maxLength ?? QUESTIONNAIRE_LIMITS.longTextDefaultMaxLength;
    case QuestionnaireFieldType.Email:
    case QuestionnaireFieldType.Phone:
    case QuestionnaireFieldType.Url:
      return QUESTIONNAIRE_LIMITS.shortTextDefaultMaxLength;
    default:
      return null;
  }
}

function isScaleStep(value: string): boolean {
  if (!SCALE_STEP_PATTERN.test(value)) return false;
  return Number(value) <= QUESTIONNAIRE_LIMITS.scaleSteps;
}

/**
 * The value as it is stored: a long text exactly as typed, every other value without the space
 * around it. Validation and the write path both go by this, so neither judges what the other drops.
 */
export function normalizeQuestionnaireValue(
  field: ValueField,
  raw: string,
): string {
  return field.type === QuestionnaireFieldType.LongText ? raw : raw.trim();
}

/**
 * Validates one raw value before it is stored in `onboarding_answers.value`. Shared by the request
 * schemas on the server and the field components on the client, so both reject the same input.
 * An empty value is never stored: the caller deletes the answer row instead.
 */
export function validateQuestionnaireValue(
  field: ValueField,
  raw: string,
): QuestionnaireValueValidationResult {
  const value = normalizeQuestionnaireValue(field, raw);
  const maxLength = getQuestionnaireValueMaxLength(field);

  switch (field.type) {
    case QuestionnaireFieldType.ShortText:
    case QuestionnaireFieldType.LongText:
    case QuestionnaireFieldType.Email:
    case QuestionnaireFieldType.Phone:
    case QuestionnaireFieldType.Url:
    case QuestionnaireFieldType.Color:
    case QuestionnaireFieldType.Scale:
    case QuestionnaireFieldType.Confirmation:
      break;
    default:
      return fail(QuestionnaireValueErrorCode.NotAValueField);
  }
  if (!value.trim()) return fail(QuestionnaireValueErrorCode.Empty);
  if (maxLength !== null && value.length > maxLength)
    return fail(QuestionnaireValueErrorCode.TooLong);

  switch (field.type) {
    case QuestionnaireFieldType.Email:
      return CONTACT_EMAIL_PATTERN.test(value)
        ? OK
        : fail(QuestionnaireValueErrorCode.InvalidEmail);
    case QuestionnaireFieldType.Phone:
      return isValidContactPhone(value)
        ? OK
        : fail(QuestionnaireValueErrorCode.InvalidPhone);
    case QuestionnaireFieldType.Url:
      return CONTACT_URL_PATTERN.test(value)
        ? OK
        : fail(QuestionnaireValueErrorCode.InvalidUrl);
    case QuestionnaireFieldType.Color:
      return COLOR_PATTERN.test(value)
        ? OK
        : fail(QuestionnaireValueErrorCode.InvalidColor);
    case QuestionnaireFieldType.Scale:
      return isScaleStep(value)
        ? OK
        : fail(QuestionnaireValueErrorCode.InvalidScale);
    case QuestionnaireFieldType.Confirmation:
      return value === QUESTIONNAIRE_CONFIRMED_VALUE
        ? OK
        : fail(QuestionnaireValueErrorCode.NotConfirmed);
    default:
      return OK;
  }
}
