import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getGoogleTagConfig,
  getGtagLoaderId,
  isGoogleTagEnabled,
} from "./google-tag-config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getGoogleTagConfig", () => {
  it("reads the configured ids from NEXT_PUBLIC env vars", () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "G-5T4BC28Z0F");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID", "AW-123456789");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL", "abcDEF123");

    expect(getGoogleTagConfig()).toEqual({
      ga4MeasurementId: "G-5T4BC28Z0F",
      adsConversionId: "AW-123456789",
      adsConversionLabel: "abcDEF123",
    });
  });

  it("normalizes empty or whitespace values to null", () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID", "   ");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL", " label ");

    expect(getGoogleTagConfig()).toEqual({
      ga4MeasurementId: null,
      adsConversionId: null,
      adsConversionLabel: "label",
    });
  });
});

describe("isGoogleTagEnabled", () => {
  it("is enabled when at least one destination id is present", () => {
    expect(
      isGoogleTagEnabled({
        ga4MeasurementId: "G-1",
        adsConversionId: null,
        adsConversionLabel: null,
      }),
    ).toBe(true);
    expect(
      isGoogleTagEnabled({
        ga4MeasurementId: null,
        adsConversionId: "AW-1",
        adsConversionLabel: null,
      }),
    ).toBe(true);
  });

  it("is disabled when no destination id is present", () => {
    expect(
      isGoogleTagEnabled({
        ga4MeasurementId: null,
        adsConversionId: null,
        adsConversionLabel: "label",
      }),
    ).toBe(false);
  });
});

describe("getGtagLoaderId", () => {
  it("prefers the GA4 id for the loader src", () => {
    expect(
      getGtagLoaderId({
        ga4MeasurementId: "G-1",
        adsConversionId: "AW-1",
        adsConversionLabel: null,
      }),
    ).toBe("G-1");
  });

  it("falls back to the ads id when GA4 is absent", () => {
    expect(
      getGtagLoaderId({
        ga4MeasurementId: null,
        adsConversionId: "AW-1",
        adsConversionLabel: null,
      }),
    ).toBe("AW-1");
  });

  it("returns null when no id is configured", () => {
    expect(
      getGtagLoaderId({
        ga4MeasurementId: null,
        adsConversionId: null,
        adsConversionLabel: null,
      }),
    ).toBeNull();
  });
});
