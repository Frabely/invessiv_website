type FireLandingConversionInput = {
  adsConversionId: string | null;
  adsConversionLabel: string | null;
  transactionId: string;
};

export function buildConversionSendTo(
  adsConversionId: string,
  adsConversionLabel: string,
): string {
  return `${adsConversionId}/${adsConversionLabel}`;
}

/**
 * Feuert das Google-Ads-Conversion-Event. No-op (gibt `false` zurück), wenn die
 * Ads-Destination nicht konfiguriert ist oder `gtag` noch nicht verfügbar ist.
 */
export function fireLandingConversion({
  adsConversionId,
  adsConversionLabel,
  transactionId,
}: FireLandingConversionInput): boolean {
  if (!adsConversionId || !adsConversionLabel) {
    return false;
  }

  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }

  window.gtag("event", "conversion", {
    send_to: buildConversionSendTo(adsConversionId, adsConversionLabel),
    transaction_id: transactionId,
  });

  return true;
}
