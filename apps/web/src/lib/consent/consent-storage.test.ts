// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import {
  CONSENT_STATE_VERSION,
  CONSENT_STORAGE_KEY,
} from "@/common/constants/consent/consent-storage";
import { ACCEPT_ALL_CONSENT_CHOICE } from "@/common/defaults/consent/consent-choice";
import {
  createStoredConsentState,
  parseStoredConsentState,
  readStoredConsentChoice,
  writeStoredConsentChoice,
} from "./consent-storage";

describe("createStoredConsentState", () => {
  it("stamps the current version and an ISO timestamp", () => {
    const now = new Date("2026-06-12T10:00:00.000Z");
    expect(
      createStoredConsentState({ analytics: true, marketing: false }, now),
    ).toEqual({
      version: CONSENT_STATE_VERSION,
      analytics: true,
      marketing: false,
      updatedAt: "2026-06-12T10:00:00.000Z",
    });
  });
});

describe("parseStoredConsentState", () => {
  it("round-trips a freshly created state", () => {
    const state = createStoredConsentState({
      analytics: true,
      marketing: true,
    });
    expect(parseStoredConsentState(JSON.stringify(state))).toEqual(state);
  });

  it("returns null for empty or nullish input", () => {
    expect(parseStoredConsentState(null)).toBeNull();
    expect(parseStoredConsentState(undefined)).toBeNull();
    expect(parseStoredConsentState("")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseStoredConsentState("{not-json")).toBeNull();
  });

  it("returns null when the stored version does not match", () => {
    const outdated = JSON.stringify({
      version: CONSENT_STATE_VERSION + 1,
      analytics: true,
      marketing: true,
      updatedAt: "2026-06-12T10:00:00.000Z",
    });
    expect(parseStoredConsentState(outdated)).toBeNull();
  });

  it("returns null when fields have the wrong type", () => {
    const malformed = JSON.stringify({
      version: CONSENT_STATE_VERSION,
      analytics: "yes",
      marketing: true,
      updatedAt: 123,
    });
    expect(parseStoredConsentState(malformed)).toBeNull();
  });
});

describe("consent storage round-trip", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no consent has been stored yet", () => {
    expect(readStoredConsentChoice()).toBeNull();
  });

  it("persists and reads back the chosen categories", () => {
    writeStoredConsentChoice({ analytics: true, marketing: false });
    expect(readStoredConsentChoice()).toEqual({
      analytics: true,
      marketing: false,
    });
  });

  it("writes the versioned state under the canonical key", () => {
    writeStoredConsentChoice(ACCEPT_ALL_CONSENT_CHOICE);
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    expect(parseStoredConsentState(raw)).toMatchObject({
      version: CONSENT_STATE_VERSION,
      analytics: true,
      marketing: true,
    });
  });

  it("ignores a stored state written under an older version", () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: CONSENT_STATE_VERSION - 1,
        analytics: true,
        marketing: true,
        updatedAt: "2026-06-12T10:00:00.000Z",
      }),
    );
    expect(readStoredConsentChoice()).toBeNull();
  });
});
