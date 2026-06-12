"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  getGoogleTagConfig,
  getGtagLoaderId,
  isGoogleTagEnabled,
} from "@/lib/analytics/google-tag/google-tag-config";
import {
  buildConsentBootstrapScript,
  buildGtagConfigScript,
  buildGtagSrc,
} from "@/lib/analytics/google-tag/google-tag-script";

const BOOTSTRAP_SCRIPT_ID = "invessiv-google-consent-bootstrap";
const LOADER_SCRIPT_ID = "invessiv-google-tag-loader";

// Route-scoped (Landing + Success), therefore `afterInteractive`: `beforeInteractive`
// only works in the root layout in the App Router and would load the tag site-wide.
// The bootstrap inline block runs synchronously and pushes the consent default +
// saved selection into `dataLayer` before the external gtag.js processes the queue.

export function GoogleTag() {
  const pathname = usePathname();
  const config = getGoogleTagConfig();
  const ga4MeasurementId = config.ga4MeasurementId;

  useEffect(() => {
    if (
      !ga4MeasurementId ||
      typeof window === "undefined" ||
      typeof window.gtag !== "function"
    ) {
      return;
    }

    window.gtag("event", "page_view", {
      send_to: ga4MeasurementId,
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, ga4MeasurementId]);

  if (!isGoogleTagEnabled(config)) {
    return null;
  }

  const loaderId = getGtagLoaderId(config);
  const bootstrapScript = [
    buildConsentBootstrapScript(),
    buildGtagConfigScript({
      ga4MeasurementId,
      adsConversionId: config.adsConversionId,
    }),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <Script
        id={BOOTSTRAP_SCRIPT_ID}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: bootstrapScript }}
      />
      {loaderId ? (
        <Script
          id={LOADER_SCRIPT_ID}
          strategy="afterInteractive"
          src={buildGtagSrc(loaderId)}
        />
      ) : null}
    </>
  );
}
