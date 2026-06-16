export type GoogleTagConfig = {
  ga4MeasurementId: string | null;
  adsConversionId: string | null;
  adsConversionEvent: string | null;
};

function normalizeEnvValue(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getGoogleTagConfig(): GoogleTagConfig {
  return {
    ga4MeasurementId: normalizeEnvValue(
      process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
    ),
    adsConversionId: normalizeEnvValue(
      process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID,
    ),
    adsConversionEvent: normalizeEnvValue(
      process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_EVENT,
    ),
  };
}

export function isGoogleTagEnabled(config: GoogleTagConfig): boolean {
  return config.ga4MeasurementId !== null || config.adsConversionId !== null;
}

export function getGtagLoaderId(config: GoogleTagConfig): string | null {
  return config.ga4MeasurementId ?? config.adsConversionId;
}
