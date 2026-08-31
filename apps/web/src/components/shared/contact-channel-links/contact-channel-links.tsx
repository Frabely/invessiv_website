import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  CONTACT_CHANNEL_KEY,
  type ContactChannelKey,
} from "@/common/constants/contact/contact-channel-keys";
import type { Locale } from "@/config/i18n";
import {
  COMPANY_MAILTO,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
  COMPANY_TEL,
} from "@/config/company";
import { getContactChannelContent } from "@/i18n/dictionaries/shared/contact-channels";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import styles from "./contact-channel-links.module.css";

type ContactChannelLinksProps = {
  analyticsLocation: string;
  channels: readonly ContactChannelKey[];
  locale: Locale;
};

const CHANNEL_ICON: Record<ContactChannelKey, IconDefinition> = {
  [CONTACT_CHANNEL_KEY.Email]: faEnvelope,
  [CONTACT_CHANNEL_KEY.Instagram]: faInstagram,
  [CONTACT_CHANNEL_KEY.Linkedin]: faLinkedinIn,
  [CONTACT_CHANNEL_KEY.Phone]: faPhone,
};

const CHANNEL_HREF: Record<ContactChannelKey, string> = {
  [CONTACT_CHANNEL_KEY.Email]: COMPANY_MAILTO,
  [CONTACT_CHANNEL_KEY.Instagram]: COMPANY_SOCIAL_INSTAGRAM,
  [CONTACT_CHANNEL_KEY.Linkedin]: COMPANY_SOCIAL_LINKEDIN,
  [CONTACT_CHANNEL_KEY.Phone]: COMPANY_TEL,
};

const EXTERNAL_CHANNELS: readonly ContactChannelKey[] = [
  CONTACT_CHANNEL_KEY.Linkedin,
  CONTACT_CHANNEL_KEY.Instagram,
];

export function ContactChannelLinks({
  analyticsLocation,
  channels,
  locale,
}: ContactChannelLinksProps) {
  const { channels: labels, listAriaLabel } = getContactChannelContent(locale);

  return (
    <ul aria-label={listAriaLabel} className={styles.list}>
      {channels.map((channel) => {
        const href = CHANNEL_HREF[channel];
        const isExternal = EXTERNAL_CHANNELS.includes(channel);

        return (
          <li key={channel}>
            <a
              aria-label={labels[channel]}
              className={styles.link}
              data-analytics-event="contact_click"
              data-analytics-location={analyticsLocation}
              data-analytics-target={getContactTarget(href) ?? channel}
              href={href}
              {...(isExternal ? { rel: "noreferrer", target: "_blank" } : {})}
            >
              <FontAwesomeIcon
                aria-hidden="true"
                icon={CHANNEL_ICON[channel]}
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
