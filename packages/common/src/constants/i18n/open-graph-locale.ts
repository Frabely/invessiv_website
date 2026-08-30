import { Locale } from "../../contracts/i18n/locale";

export const OPEN_GRAPH_LOCALE = {
  [Locale.De]: "de_DE",
  [Locale.En]: "en_US",
} as const satisfies Record<Locale, string>;

export type OpenGraphLocale =
  (typeof OPEN_GRAPH_LOCALE)[keyof typeof OPEN_GRAPH_LOCALE];
