import type { ConsentChoice } from "@/common/contracts/consent/consent-choice";
import { mapConsentChoiceToGoogleSignals } from "./consent-mode";

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
