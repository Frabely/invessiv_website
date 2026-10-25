/** Text-link levels below the primary and secondary buttons. */
export const TextCtaVariant = {
  /** Third level: text and underline in the action gradient. */
  Tertiary: "tertiary",
  /** Fourth level: action-colored text with a gradient underline. */
  Quaternary: "quaternary",
} as const;

export type TextCtaVariant =
  (typeof TextCtaVariant)[keyof typeof TextCtaVariant];
