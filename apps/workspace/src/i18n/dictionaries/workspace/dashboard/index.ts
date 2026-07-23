import type { Locale } from "@/config/i18n";
import metaDe from "./meta/de.json";
import metaEn from "./meta/en.json";
import headerDe from "./header/de.json";
import headerEn from "./header/en.json";
import rangeFilterDe from "./range-filter/de.json";
import rangeFilterEn from "./range-filter/en.json";
import modulesDe from "./modules/de.json";
import modulesEn from "./modules/en.json";
import acquisitionVolumeDe from "./acquisition-volume/de.json";
import acquisitionVolumeEn from "./acquisition-volume/en.json";
import messagingDe from "./messaging/de.json";
import messagingEn from "./messaging/en.json";

export type DashboardMetaDictionary = typeof metaDe;
export type DashboardHeaderDictionary = typeof headerDe;
export type DashboardRangeFilterDictionary = typeof rangeFilterDe;
export type DashboardModulesDictionary = typeof modulesDe;
export type DashboardAcquisitionVolumeDictionary = typeof acquisitionVolumeDe;
export type DashboardMessagingDictionary = typeof messagingDe;

const DASHBOARD_META: Record<Locale, DashboardMetaDictionary> = {
  de: metaDe,
  en: metaEn,
};

const DASHBOARD_HEADER: Record<Locale, DashboardHeaderDictionary> = {
  de: headerDe,
  en: headerEn,
};

const DASHBOARD_RANGE_FILTER: Record<Locale, DashboardRangeFilterDictionary> = {
  de: rangeFilterDe,
  en: rangeFilterEn,
};

const DASHBOARD_MODULES: Record<Locale, DashboardModulesDictionary> = {
  de: modulesDe,
  en: modulesEn,
};

const DASHBOARD_ACQUISITION_VOLUME: Record<
  Locale,
  DashboardAcquisitionVolumeDictionary
> = {
  de: acquisitionVolumeDe,
  en: acquisitionVolumeEn,
};

const DASHBOARD_MESSAGING: Record<Locale, DashboardMessagingDictionary> = {
  de: messagingDe,
  en: messagingEn,
};

export function getDashboardMetaDictionary(
  locale: Locale,
): DashboardMetaDictionary {
  return DASHBOARD_META[locale];
}

export function getDashboardHeaderDictionary(
  locale: Locale,
): DashboardHeaderDictionary {
  return DASHBOARD_HEADER[locale];
}

export function getDashboardRangeFilterDictionary(
  locale: Locale,
): DashboardRangeFilterDictionary {
  return DASHBOARD_RANGE_FILTER[locale];
}

export function getDashboardModulesDictionary(
  locale: Locale,
): DashboardModulesDictionary {
  return DASHBOARD_MODULES[locale];
}

export function getDashboardAcquisitionVolumeDictionary(
  locale: Locale,
): DashboardAcquisitionVolumeDictionary {
  return DASHBOARD_ACQUISITION_VOLUME[locale];
}

export function getDashboardMessagingDictionary(
  locale: Locale,
): DashboardMessagingDictionary {
  return DASHBOARD_MESSAGING[locale];
}
