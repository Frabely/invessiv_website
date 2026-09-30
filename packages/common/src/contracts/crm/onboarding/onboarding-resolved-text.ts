import type { Locale } from "@invessiv/common";

/** A translated text picked for a viewer; `isFallback` drives the "not available in your language" hint. */
export interface OnboardingResolvedText<T> {
  text: T;
  /** Locale the text was actually taken from. */
  locale: Locale;
  /** True when the preferred locale was missing and another one was used. */
  isFallback: boolean;
}
