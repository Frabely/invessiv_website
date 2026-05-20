"use client";

import type { Locale } from "@/config/i18n";
import type { Theme } from "@/lib/theme/theme";
import { trackConversionEvent } from "@/lib/analytics/conversion-events";

const SITE_HEADER_ANALYTICS_LOCATION = "header";

export function trackSiteHeaderLanguageSwitch(nextLocale: Locale) {
  trackConversionEvent("language_switch", {
    location: SITE_HEADER_ANALYTICS_LOCATION,
    target: nextLocale,
  });
}

export function trackSiteHeaderThemeSwitch(nextTheme: Theme) {
  trackConversionEvent("theme_switch", {
    location: SITE_HEADER_ANALYTICS_LOCATION,
    target: nextTheme,
  });
}
