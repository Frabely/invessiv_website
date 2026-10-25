import { FOOTER_SECTION_ID, SECTION_HREFS } from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import { getNavigationItem } from "@/lib/analytics/get-navigation-item";
import { AnalyticsArea } from "@/common/constants/analytics/analytics-area";
import { AnalyticsCtaId } from "@/common/constants/analytics/analytics-cta-id";
import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import { AnalyticsTarget } from "@/common/constants/analytics/analytics-target";
import { analyticsAttributes } from "@/common/patterns/analytics/analytics-properties";
import type { Locale } from "@/config/i18n";
import type { FooterColumnCopy } from "@/i18n/dictionaries/marketing/home";
import { getFooterStaticContent } from "@/i18n/dictionaries/shared/footer";
import { CONTACT_CHANNEL_KEYS } from "@/common/constants/contact/contact-channel-keys";
import { ContactIdentity } from "@/components/shared/contact-identity/contact-identity";
import { BrandLockup } from "@invessiv/ui";
import styles from "./footer-section.module.css";

export type FooterSectionProps = {
  description: string;
  locale: Locale;
  navColumn: FooterColumnCopy;
};

export function FooterSection({
  description,
  locale,
  navColumn,
}: FooterSectionProps) {
  const copy = getFooterStaticContent(locale);
  const referencesHref = createLocalePathname(SITE_ROUTES.REFERENCES, locale);

  const isPlaceholderHref = (href: string) =>
    href.includes("placeholder") || href.includes("PLATZHALTER");

  const getLinkAnalyticsProps = (href: string) => {
    const channel = getContactTarget(href);
    if (channel) {
      return analyticsAttributes(AnalyticsEventName.ContactChannelClicked, {
        channel,
        area: AnalyticsArea.Footer,
      });
    }
    if (href === SECTION_HREFS.contact) {
      return analyticsAttributes(AnalyticsEventName.CtaClicked, {
        cta: AnalyticsCtaId.FooterContact,
        target: AnalyticsTarget.ContactForm,
      });
    }
    return analyticsAttributes(AnalyticsEventName.NavClicked, {
      item: getNavigationItem(href),
      area: AnalyticsArea.Footer,
    });
  };

  const filteredNavColumn: FooterColumnCopy = {
    ...navColumn,
    links: navColumn.links.filter((link) => !isPlaceholderHref(link.href)),
  };

  const columns = [
    filteredNavColumn,
    { title: copy.legalTitle, links: copy.legalLinks },
    {
      title: copy.invessivTitle,
      links: [
        ...copy.invessivLinks,
        { label: copy.referencesLabel, href: referencesHref },
      ],
    },
  ];

  return (
    <footer className={styles.footer} id={FOOTER_SECTION_ID}>
      <div className={styles.inner}>
        <div className={styles.shell}>
          <div className={styles.layout}>
            <section className={styles.identity}>
              <strong className={styles.brand}>
                <BrandLockup label={copy.brand} logoAlt={copy.brandLogoAlt} />
              </strong>

              <p className={styles.description}>{description}</p>
            </section>

            <div className={styles.grid} role="list">
              {columns.map((column) => (
                <section
                  className={styles.column}
                  key={column.title}
                  role="listitem"
                >
                  <h3 className={styles.heading}>{column.title}</h3>
                  <ul className={styles.linkList}>
                    {column.links.map((link) => (
                      <li key={`${column.title}-${link.label}`}>
                        <a
                          className={
                            isPlaceholderHref(link.href)
                              ? `${styles.link} ${styles.placeholderLink}`
                              : styles.link
                          }
                          href={link.href}
                          {...getLinkAnalyticsProps(link.href)}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              <section className={styles.column} role="listitem">
                <h3 className={styles.heading}>{copy.contactTitle}</h3>
                <ContactIdentity
                  analyticsArea={AnalyticsArea.Footer}
                  centerOnMobile
                  channels={CONTACT_CHANNEL_KEYS}
                  locale={locale}
                />
              </section>
            </div>
          </div>

          <div className={styles.bottom}>
            <div className={styles.bottomMeta}>
              <span>{copy.copyright}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
