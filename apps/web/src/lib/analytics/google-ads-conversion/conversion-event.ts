import type { FireLandingConversionInput } from "@/common/contracts/analytics/fire-landing-conversion-input";

/**
 * Feuert die Google-Ads-Conversion als event-basiertes Conversion-Event (neue
 * „Google-Tag"-Conversions, kein `send_to`/Label). Der Event-Name wird in Google
 * Ads der Conversion-Aktion zugeordnet; die AW-Destination muss dafür über
 * `adsConversionId` geladen sein. No-op (gibt `false` zurück), wenn die Ads-
 * Destination/das Event nicht konfiguriert ist oder `gtag` noch nicht verfügbar ist.
 */
export function fireLandingConversion({
  adsConversionId,
  adsConversionEvent,
  transactionId,
}: FireLandingConversionInput): boolean {
  if (!adsConversionId || !adsConversionEvent) {
    return false;
  }

  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }

  window.gtag("event", adsConversionEvent, {
    transaction_id: transactionId,
  });

  return true;
}
