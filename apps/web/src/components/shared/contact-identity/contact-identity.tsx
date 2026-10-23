import type { AnalyticsArea } from "@/common/constants/analytics/analytics-area";
import type { ContactChannelKey } from "@/common/constants/contact/contact-channel-keys";
import { COMPANY } from "@/config/company";
import type { Locale } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { ContactChannelLinks } from "@/components/shared/contact-channel-links/contact-channel-links";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
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
  const companyDetailsHref = `${createLocalePathname(SITE_ROUTES.IMPRINT, locale)}#company-details`;

  return (
    <div className={styles.root} data-center-mobile={centerOnMobile}>
      <p className={styles.name}>{COMPANY.owner}</p>
      <a className={styles.brand} href={companyDetailsHref}>
        {COMPANY.brandName}
      </a>

      <ContactChannelLinks
        analyticsArea={analyticsArea}
        channels={channels}
        locale={locale}
      />
    </div>
  );
}
