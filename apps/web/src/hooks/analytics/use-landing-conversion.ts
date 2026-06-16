"use client";

import { useEffect } from "react";
import { fireLandingConversion } from "@/lib/analytics/google-ads-conversion/conversion-event";
import { consumeLandingConversionGuard } from "@/lib/analytics/google-ads-conversion/conversion-guard";
import { getGoogleTagConfig } from "@/lib/analytics/google-tag/google-tag-config";

/**
 * Feuert die Google-Ads-Conversion auf der Success-Route genau dann, wenn der
 * Redirect das Guard-Flag gesetzt hat. Direktaufrufe haben kein Flag und feuern
 * nicht; das Flag wird beim Lesen konsumiert, daher kein Doppelfeuern bei Reload.
 */
export function useLandingConversion(): void {
  useEffect(() => {
    const transactionId = consumeLandingConversionGuard();
    if (!transactionId) {
      return;
    }

    const config = getGoogleTagConfig();
    fireLandingConversion({
      adsConversionId: config.adsConversionId,
      adsConversionEvent: config.adsConversionEvent,
      transactionId,
    });
  }, []);
}
