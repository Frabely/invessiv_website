import { reportClientError } from "@/lib/observability/report-client-error";

export const LANDING_CONVERSION_GUARD_KEY = "invessiv-landing-ads-conversion";

export function createConversionTransactionId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `txn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function markLandingConversionPending(transactionId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(LANDING_CONVERSION_GUARD_KEY, transactionId);
  } catch (error) {
    reportClientError("conversion-guard.mark", error);
  }
}

/**
 * Liest das Guard-Flag und löscht es im selben Schritt (Konsum-Pattern), damit ein
 * Reload oder Back/Forward auf der Success-Seite keine zweite Conversion auslöst.
 */
export function consumeLandingConversionGuard(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const transactionId = window.sessionStorage.getItem(
      LANDING_CONVERSION_GUARD_KEY,
    );
    if (!transactionId) {
      return null;
    }

    window.sessionStorage.removeItem(LANDING_CONVERSION_GUARD_KEY);
    return transactionId;
  } catch (error) {
    reportClientError("conversion-guard.consume", error);
    return null;
  }
}
