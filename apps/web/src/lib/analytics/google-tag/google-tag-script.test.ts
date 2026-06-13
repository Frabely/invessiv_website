import { describe, expect, it } from "vitest";

import { CONSENT_STORAGE_KEY } from "@/common/constants/storage/storage-keys";
import {
  buildConsentBootstrapScript,
  buildGtagConfigScript,
  buildGtagSrc,
} from "./google-tag-script";

describe("buildGtagSrc", () => {
  it("builds the gtag.js loader url for a given id", () => {
    expect(buildGtagSrc("G-5T4BC28Z0F")).toBe(
      "https://www.googletagmanager.com/gtag/js?id=G-5T4BC28Z0F",
    );
  });
});

describe("buildConsentBootstrapScript", () => {
  const script = buildConsentBootstrapScript();

  it("defines the dataLayer and gtag stub", () => {
    expect(script).toContain("window.dataLayer = window.dataLayer || [];");
    expect(script).toContain("function gtag(){dataLayer.push(arguments);}");
    expect(script).toContain("window.gtag = gtag;");
  });

  it("sets consent default denied with wait_for_update", () => {
    expect(script).toContain('"analytics_storage":"denied"');
    expect(script).toContain('"ad_storage":"denied"');
    expect(script).toContain('"ad_user_data":"denied"');
    expect(script).toContain('"ad_personalization":"denied"');
    expect(script).toContain('"wait_for_update":500');
  });

  it("sets the redaction and passthrough companion params", () => {
    expect(script).toContain("gtag('set', 'ads_data_redaction', true);");
    expect(script).toContain("gtag('set', 'url_passthrough', true);");
  });

  it("reads the versioned stored choice and maps it to a consent update", () => {
    expect(script).toContain(
      `window.localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)})`,
    );
    expect(script).toContain("parsed.version!==1");
    expect(script).toContain('parsed.analytics?"granted":"denied"');
    expect(script).toContain('parsed.marketing?"granted":"denied"');
    expect(script).toContain(
      "}catch(e){if(typeof console!=='undefined'){console.warn('[invessiv:consent-bootstrap]',e);}}",
    );
  });
});

describe("buildGtagConfigScript", () => {
  it("configures GA4 with send_page_view disabled", () => {
    const script = buildGtagConfigScript({
      ga4MeasurementId: "G-5T4BC28Z0F",
      adsConversionId: null,
    });
    expect(script).toBe(
      'gtag(\'config\', "G-5T4BC28Z0F", {"send_page_view":false});',
    );
  });

  it("configures the ads destination", () => {
    const script = buildGtagConfigScript({
      ga4MeasurementId: null,
      adsConversionId: "AW-123456789",
    });
    expect(script).toBe("gtag('config', \"AW-123456789\");");
  });

  it("configures both destinations when present", () => {
    const script = buildGtagConfigScript({
      ga4MeasurementId: "G-1",
      adsConversionId: "AW-1",
    });
    expect(script).toContain(
      'gtag(\'config\', "G-1", {"send_page_view":false});',
    );
    expect(script).toContain("gtag('config', \"AW-1\");");
  });

  it("returns an empty string when no destination is configured", () => {
    expect(
      buildGtagConfigScript({ ga4MeasurementId: null, adsConversionId: null }),
    ).toBe("");
  });
});
