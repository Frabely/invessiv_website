import { mapConsentChoiceToGoogleSignals } from "./consent-mode";
import type { ConsentChoice } from "./consent-types";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function emitConsentUpdate(choice: ConsentChoice): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("consent", "update", mapConsentChoiceToGoogleSignals(choice));
}
