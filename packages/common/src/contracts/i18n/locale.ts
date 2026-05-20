export const Locale = {
  De: "de",
  En: "en",
} as const;

export type Locale = (typeof Locale)[keyof typeof Locale];

export const SUPPORTED_LOCALES = [Locale.De, Locale.En] as const;
