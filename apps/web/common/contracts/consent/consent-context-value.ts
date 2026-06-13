import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { ConsentChoice } from "@/common/contracts/consent/consent-choice";
import type { ConsentStaticContent } from "@/i18n/dictionaries/shared/consent";

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
