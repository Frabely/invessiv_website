import type { AnalyticsArea } from "@/common/constants/analytics/analytics-area";
import type { ContactChannelKey } from "@/common/constants/contact/contact-channel-keys";
import { COMPANY } from "@/config/company";
import type { Locale } from "@/config/i18n";
import { ContactChannelLinks } from "@/components/shared/contact-channel-links/contact-channel-links";
import styles from "./contact-identity.module.css";

type ContactIdentityProps = {
  analyticsArea: AnalyticsArea;
  centerOnMobile?: boolean;
  channels: readonly ContactChannelKey[];
  locale: Locale;
};

export function ContactIdentity({
  analyticsArea,
  centerOnMobile = false,
  channels,
  locale,
}: ContactIdentityProps) {
  return (
    <div className={styles.root} data-center-mobile={centerOnMobile}>
      <p className={styles.name}>{COMPANY.owner}</p>
      <p className={styles.brand}>{COMPANY.brandName}</p>

      <ContactChannelLinks
        analyticsArea={analyticsArea}
        channels={channels}
        locale={locale}
      />
    </div>
  );
}
