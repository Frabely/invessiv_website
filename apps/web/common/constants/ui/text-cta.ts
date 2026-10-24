export const TEXT_CTA_VARIANT = {
  Tertiary: "tertiary",
  Quaternary: "quaternary",
} as const;

export type TextCtaVariant =
  (typeof TEXT_CTA_VARIANT)[keyof typeof TEXT_CTA_VARIANT];

export const TEXT_CTA_ELEMENT = {
  Anchor: "a",
  Button: "button",
  Summary: "summary",
} as const;
