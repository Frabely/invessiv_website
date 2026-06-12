import { createContext } from "react";
import type { Locale } from "@/config/i18n";
import type { ConsentStaticContent } from "@/i18n/dictionaries/shared/consent";
import type { ConsentChoice } from "@/lib/consent/consent-types";

export type ConsentContextValue = {
  locale: Locale;
  content: ConsentStaticContent;
  choice: ConsentChoice | null;
  isBannerOpen: boolean;
  isSettingsOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  saveChoice: (choice: ConsentChoice) => void;
  openSettings: () => void;
  closeSettings: () => void;
  dismissBanner: () => void;
};

export const ConsentContext = createContext<ConsentContextValue | null>(null);
