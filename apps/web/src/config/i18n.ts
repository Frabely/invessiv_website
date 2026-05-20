export {
  SUPPORTED_LOCALES,
  type Locale,
} from "@invessiv/common/contracts/i18n/locale";

import {
  type Locale,
  SUPPORTED_LOCALES,
} from "@invessiv/common/contracts/i18n/locale";

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}
