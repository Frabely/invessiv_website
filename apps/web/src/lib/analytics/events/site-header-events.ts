"use client";

import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import { AnalyticsPreferenceType } from "@/common/constants/analytics/analytics-preference-type";
import type { Locale } from "@/config/i18n";
import type { Theme } from "@/lib/theme/theme";
import { trackAnalyticsEvent } from "@/lib/analytics/track-analytics-event";

export function trackSiteHeaderLanguageSwitch(nextLocale: Locale) {
  trackAnalyticsEvent(AnalyticsEventName.PreferenceChanged, {
    type: AnalyticsPreferenceType.Language,
    value: nextLocale,
  });
}

export function trackSiteHeaderThemeSwitch(nextTheme: Theme) {
  trackAnalyticsEvent(AnalyticsEventName.PreferenceChanged, {
    type: AnalyticsPreferenceType.Theme,
    value: nextTheme,
  });
}
