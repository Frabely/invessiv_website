/** Why a typed duration cannot be used; each value keys a text in the hours dictionary. */
export const DurationInputError = {
  Invalid: "invalid",
  Required: "required",
  TooMuch: "tooMuch",
} as const;

export type DurationInputError =
  (typeof DurationInputError)[keyof typeof DurationInputError];
