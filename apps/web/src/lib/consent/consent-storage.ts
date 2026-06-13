import { reportClientError } from "@/lib/observability/report-client-error";
import { type ConsentChoice } from "./consent-types";

export const CONSENT_STORAGE_KEY = "invessiv-consent";
export const CONSENT_STATE_VERSION = 1;

export type StoredConsentState = {
  version: number;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export function createStoredConsentState(
  choice: ConsentChoice,
  now: Date = new Date(),
): StoredConsentState {
  return {
    version: CONSENT_STATE_VERSION,
    analytics: choice.analytics,
    marketing: choice.marketing,
    updatedAt: now.toISOString(),
  };
}

export function toConsentChoice(state: StoredConsentState): ConsentChoice {
  return { analytics: state.analytics, marketing: state.marketing };
}

export function parseStoredConsentState(
  raw: string | null | undefined,
): StoredConsentState | null {
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    reportClientError("consent-storage.parse", error);
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;

  if (candidate.version !== CONSENT_STATE_VERSION) {
    return null;
  }

  if (
    typeof candidate.analytics !== "boolean" ||
    typeof candidate.marketing !== "boolean" ||
    typeof candidate.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    version: CONSENT_STATE_VERSION,
    analytics: candidate.analytics,
    marketing: candidate.marketing,
    updatedAt: candidate.updatedAt,
  };
}

export function readStoredConsentState(): StoredConsentState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return parseStoredConsentState(
      window.localStorage.getItem(CONSENT_STORAGE_KEY),
    );
  } catch (error) {
    reportClientError("consent-storage.read", error);
    return null;
  }
}

export function readStoredConsentChoice(): ConsentChoice | null {
  const state = readStoredConsentState();
  return state ? toConsentChoice(state) : null;
}

export function writeStoredConsentChoice(
  choice: ConsentChoice,
): StoredConsentState | null {
  const state = createStoredConsentState(choice);

  if (typeof window === "undefined") {
    return state;
  }

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    reportClientError("consent-storage.write", error);
    return null;
  }

  return state;
}
