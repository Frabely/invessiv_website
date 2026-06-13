import {
  CONSENT_DEFAULT_PARAMS,
  DEFAULT_GOOGLE_CONSENT_SIGNALS,
} from "@/lib/consent/consent-mode";
import {
  CONSENT_STATE_VERSION,
  CONSENT_STORAGE_KEY,
} from "@/lib/consent/consent-storage";

const GTAG_BASE_SRC = "https://www.googletagmanager.com/gtag/js";

export function buildGtagSrc(loaderId: string): string {
  return `${GTAG_BASE_SRC}?id=${encodeURIComponent(loaderId)}`;
}

/**
 * Inline-Stub, der vor dem externen gtag.js synchron läuft: definiert `dataLayer`
 * und `gtag`, setzt Consent-Default `denied` inkl. Begleitparameter und wendet eine
 * bereits gespeicherte Auswahl per `consent update` an, bevor der erste Ping feuert.
 */
export function buildConsentBootstrapScript(): string {
  const defaultConsent = JSON.stringify({
    ...DEFAULT_GOOGLE_CONSENT_SIGNALS,
    wait_for_update: CONSENT_DEFAULT_PARAMS.wait_for_update,
  });
  const storageKey = JSON.stringify(CONSENT_STORAGE_KEY);

  return [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){dataLayer.push(arguments);}",
    "window.gtag = gtag;",
    "gtag('js', new Date());",
    `gtag('consent', 'default', ${defaultConsent});`,
    `gtag('set', 'ads_data_redaction', ${CONSENT_DEFAULT_PARAMS.ads_data_redaction});`,
    `gtag('set', 'url_passthrough', ${CONSENT_DEFAULT_PARAMS.url_passthrough});`,
    "(function(){try{" +
      `var stored=window.localStorage.getItem(${storageKey});` +
      "if(!stored)return;" +
      "var parsed=JSON.parse(stored);" +
      `if(!parsed||parsed.version!==${CONSENT_STATE_VERSION})return;` +
      "gtag('consent','update',{" +
      '"analytics_storage":parsed.analytics?"granted":"denied",' +
      '"ad_storage":parsed.marketing?"granted":"denied",' +
      '"ad_user_data":parsed.marketing?"granted":"denied",' +
      '"ad_personalization":parsed.marketing?"granted":"denied"' +
      "});" +
      "}catch(e){if(typeof console!=='undefined'){console.warn('[invessiv:consent-bootstrap]',e);}}})();",
  ].join("\n");
}

type GtagConfigInput = {
  ga4MeasurementId: string | null;
  adsConversionId: string | null;
};

/**
 * Konfiguriert die aktiven Destinationen. GA4 nutzt `send_page_view: false`, weil
 * der Form-Redirect eine SPA-Navigation ist und `page_view` manuell gesendet wird.
 */
export function buildGtagConfigScript({
  ga4MeasurementId,
  adsConversionId,
}: GtagConfigInput): string {
  const lines: string[] = [];

  if (ga4MeasurementId) {
    lines.push(
      `gtag('config', ${JSON.stringify(ga4MeasurementId)}, {"send_page_view":false});`,
    );
  }

  if (adsConversionId) {
    lines.push(`gtag('config', ${JSON.stringify(adsConversionId)});`);
  }

  return lines.join("\n");
}
