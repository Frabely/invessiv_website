/**
 * The fixed set of field types. Rendering and validation of a type are code; texts, options,
 * requirement, limits and conditions of a field are data.
 */
export const OnboardingFieldType = {
  ShortText: "short_text",
  LongText: "long_text",
  Email: "email",
  Phone: "phone",
  Url: "url",
  Choice: "choice",
  MultiChoice: "multi_choice",
  YesNo: "yes_no",
  Scale: "scale",
  Color: "color",
  Files: "files",
  Confirmation: "confirmation",
  Group: "group",
  ProjectServices: "project_services",
} as const;

export type OnboardingFieldType =
  (typeof OnboardingFieldType)[keyof typeof OnboardingFieldType];

export const ONBOARDING_FIELD_TYPE_VALUES = [
  OnboardingFieldType.ShortText,
  OnboardingFieldType.LongText,
  OnboardingFieldType.Email,
  OnboardingFieldType.Phone,
  OnboardingFieldType.Url,
  OnboardingFieldType.Choice,
  OnboardingFieldType.MultiChoice,
  OnboardingFieldType.YesNo,
  OnboardingFieldType.Scale,
  OnboardingFieldType.Color,
  OnboardingFieldType.Files,
  OnboardingFieldType.Confirmation,
  OnboardingFieldType.Group,
  OnboardingFieldType.ProjectServices,
] as const;

/** Types that carry rows in `onboarding_field_choices`. For `scale` they only label the two poles. */
export const ONBOARDING_CHOICE_FIELD_TYPE_VALUES = [
  OnboardingFieldType.Choice,
  OnboardingFieldType.MultiChoice,
  OnboardingFieldType.YesNo,
  OnboardingFieldType.Scale,
] as const;

/** Types whose answer references a `choice_id` instead of a `value`. */
export const ONBOARDING_CHOICE_ANSWER_TYPE_VALUES = [
  OnboardingFieldType.Choice,
  OnboardingFieldType.MultiChoice,
  OnboardingFieldType.YesNo,
] as const;

/** Only these may make another field of the same block and level visible. */
export const ONBOARDING_CONDITION_TRIGGER_TYPE_VALUES = [
  OnboardingFieldType.Choice,
  OnboardingFieldType.MultiChoice,
  OnboardingFieldType.YesNo,
] as const;

/** Free text stored in `value`; a non-empty value answers the field. */
export const ONBOARDING_TEXT_FIELD_TYPE_VALUES = [
  OnboardingFieldType.ShortText,
  OnboardingFieldType.LongText,
  OnboardingFieldType.Email,
  OnboardingFieldType.Phone,
  OnboardingFieldType.Url,
] as const;

/** Only these may set `max_length`. */
export const ONBOARDING_LENGTH_LIMITED_FIELD_TYPE_VALUES = [
  OnboardingFieldType.ShortText,
  OnboardingFieldType.LongText,
] as const;

/** Only these may set `min_items`/`max_items`; each counts entries instead of a single value. */
export const ONBOARDING_ITEM_COUNT_FIELD_TYPE_VALUES = [
  OnboardingFieldType.Files,
  OnboardingFieldType.Group,
  OnboardingFieldType.MultiChoice,
] as const;

/** Groups are exactly one level deep, and the service confirmation belongs to the form itself. */
export const ONBOARDING_GROUP_CHILD_EXCLUDED_TYPE_VALUES = [
  OnboardingFieldType.Group,
  OnboardingFieldType.ProjectServices,
] as const;

/**
 * Types without rows in `onboarding_answers`: files live in `onboarding_answer_files`, group
 * entries in `onboarding_group_entries`, the service confirmation on `onboarding_forms`.
 */
export const ONBOARDING_NON_ANSWER_ROW_TYPE_VALUES = [
  OnboardingFieldType.Files,
  OnboardingFieldType.Group,
  OnboardingFieldType.ProjectServices,
] as const;
