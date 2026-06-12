import {
  CONSENT_STORAGE_KEY,
  parseStoredConsentState,
  toConsentChoice,
} from "./consent-storage";
import type { ConsentChoice } from "./consent-types";

export const CONSENT_CHANGE_EVENT = "invessiv:consent-change";

export const CONSENT_SNAPSHOT_UNKNOWN = Symbol.for("invessiv.consent.unknown");

export type ConsentSnapshot =
  | ConsentChoice
  | null
  | typeof CONSENT_SNAPSHOT_UNKNOWN;

let cachedRaw: string | null = null;
let cachedChoice: ConsentChoice | null = null;
let hasCachedChoice = false;

export function subscribeToConsent(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onChange);
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  };
}

export function getConsentSnapshot(): ConsentSnapshot {
  const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (hasCachedChoice && raw === cachedRaw) {
    return cachedChoice;
  }

  const state = parseStoredConsentState(raw);
  cachedRaw = raw;
  cachedChoice = state ? toConsentChoice(state) : null;
  hasCachedChoice = true;
  return cachedChoice;
}

export function getConsentServerSnapshot(): ConsentSnapshot {
  return CONSENT_SNAPSHOT_UNKNOWN;
}

export function notifyConsentChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}
