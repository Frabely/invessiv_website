import type { ReactNode } from "react";
import Image from "next/image";
import { FOOTER_SECTION_ID, SECTION_HREFS } from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import type { Locale } from "@/config/i18n";
import type { FooterColumnCopy } from "@/i18n/dictionaries/marketing/home";
import { getFooterStaticContent } from "@/i18n/dictionaries/shared/footer";
import { CONTACT_CHANNEL_KEYS } from "@/common/constants/contact/contact-channel-keys";
import { ContactIdentity } from "@/components/shared/contact-identity/contact-identity";
import styles from "./footer-section.module.css";

export type FooterSectionProps = {
  cookieSettings?: ReactNode;
  description: string;
  locale: Locale;
  navColumn: FooterColumnCopy;
};

export function FooterSection({
  cookieSettings,
  description,
  locale,
  navColumn,
}: FooterSectionProps) {
  const copy = getFooterStaticContent(locale);
  const referencesHref = createLocalePathname(SITE_ROUTES.REFERENCES, locale);

  const isPlaceholderHref = (href: string) =>
    href.includes("placeholder") || href.includes("PLATZHALTER");

  const getLinkAnalyticsProps = (href: string) => {
    const contactTarget = getContactTarget(href);
    if (contactTarget) {
      return {
        "data-analytics-event": "contact_click",
        "data-analytics-location": "footer",
        "data-analytics-target": contactTarget,
      };
    }
    if (href === SECTION_HREFS.contact) {
      return {
        "data-analytics-event": "cta_click",
        "data-analytics-location": "footer",
        "data-analytics-variant": "primary",
        "data-analytics-target": "form",
      };
    }
    return {};
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
              <span className={styles.brand}>
                <Image
                  src="/brand/icon.png"
                  alt="Invessiv Logo"
                  width={24}
                  height={24}
                />
                <strong>{copy.brand}</strong>
              </span>

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
                  analyticsLocation="footer"
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
            {cookieSettings ? (
              <div className={styles.cookieSettings}>{cookieSettings}</div>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
