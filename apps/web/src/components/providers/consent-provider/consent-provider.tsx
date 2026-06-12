"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { ConsentBanner } from "@/components/consent/consent-banner/consent-banner";
import {
  ConsentContext,
  type ConsentContextValue,
} from "@/components/providers/consent-provider/consent-context";
import type { Locale } from "@/config/i18n";
import type { ConsentStaticContent } from "@/i18n/dictionaries/shared/consent";
import {
  ACCEPT_ALL_CONSENT_CHOICE,
  type ConsentChoice,
  REJECT_ALL_CONSENT_CHOICE,
} from "@/lib/consent/consent-types";
import { writeStoredConsentChoice } from "@/lib/consent/consent-storage";
import {
  CONSENT_SNAPSHOT_UNKNOWN,
  getConsentServerSnapshot,
  getConsentSnapshot,
  notifyConsentChange,
  subscribeToConsent,
} from "@/lib/consent/consent-store";
import { emitConsentUpdate } from "@/lib/consent/google-consent";

type ConsentProviderProps = {
  children: ReactNode;
  content: ConsentStaticContent;
  locale: Locale;
};

type BannerOverride = {
  open: boolean;
  settings: boolean;
};

export function ConsentProvider({
  children,
  content,
  locale,
}: ConsentProviderProps) {
  const snapshot = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );
  const [override, setOverride] = useState<BannerOverride | null>(null);

  const isSnapshotKnown = snapshot !== CONSENT_SNAPSHOT_UNKNOWN;
  const choice = isSnapshotKnown ? (snapshot as ConsentChoice | null) : null;
  const isBannerOpen = override
    ? override.open
    : isSnapshotKnown && choice === null;
  const isSettingsOpen = override ? override.settings : false;

  const commit = useCallback((nextChoice: ConsentChoice) => {
    writeStoredConsentChoice(nextChoice);
    notifyConsentChange();
    emitConsentUpdate(nextChoice);
    setOverride({ open: false, settings: false });
  }, []);

  const acceptAll = useCallback(() => {
    commit(ACCEPT_ALL_CONSENT_CHOICE);
  }, [commit]);

  const rejectAll = useCallback(() => {
    commit(REJECT_ALL_CONSENT_CHOICE);
  }, [commit]);

  const saveChoice = useCallback(
    (nextChoice: ConsentChoice) => {
      commit(nextChoice);
    },
    [commit],
  );

  const openSettings = useCallback(() => {
    setOverride({ open: true, settings: true });
  }, []);

  const closeSettings = useCallback(() => {
    setOverride({ open: true, settings: false });
  }, []);

  const dismissBanner = useCallback(() => {
    setOverride({ open: false, settings: false });
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      locale,
      content,
      choice,
      isBannerOpen,
      isSettingsOpen,
      acceptAll,
      rejectAll,
      saveChoice,
      openSettings,
      closeSettings,
      dismissBanner,
    }),
    [
      locale,
      content,
      choice,
      isBannerOpen,
      isSettingsOpen,
      acceptAll,
      rejectAll,
      saveChoice,
      openSettings,
      closeSettings,
      dismissBanner,
    ],
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {isBannerOpen ? <ConsentBanner /> : null}
    </ConsentContext.Provider>
  );
}
