import type { Locale } from "@/config/i18n";
import type { ContactChannelKey } from "@/common/constants/contact/contact-channel-keys";
import de from "./de.json";
import en from "./en.json";

export type ContactChannelContent = {
  listAriaLabel: string;
  channels: Record<ContactChannelKey, string>;
};

const CONTACT_CHANNEL_CONTENT: Record<Locale, ContactChannelContent> = {
  de,
  en,
};

export function getContactChannelContent(
  locale: Locale,
): ContactChannelContent {
  return CONTACT_CHANNEL_CONTENT[locale];
}
