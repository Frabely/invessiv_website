import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { LeadSocialPlatform } from "@invessiv/common/constants/leads/social/lead-social-platforms";
import {
  COMPANY,
  COMPANY_MAILTO,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
  COMPANY_TEL,
} from "@/config/company";
import { FOOTER_SECTION_ID, SECTION_HREFS } from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import type { Locale } from "@/config/i18n";
import type { FooterColumnCopy } from "@/i18n/dictionaries/marketing/home";
import { getFooterStaticContent } from "@/i18n/dictionaries/shared/footer";
import styles from "./footer-section.module.css";

export type FooterSectionProps = {
  description: string;
  locale: Locale;
  navColumn: FooterColumnCopy;
};

const PHONE_DISPLAY: Record<Locale, string> = {
  de: COMPANY.contact.phoneDisplayDe,
  en: COMPANY.contact.phoneDisplayEn,
};

const SOCIAL_LINKS = [
  {
    platform: LeadSocialPlatform.Linkedin,
    href: COMPANY_SOCIAL_LINKEDIN,
    label: "LinkedIn",
    icon: faLinkedinIn,
  },
  {
    platform: LeadSocialPlatform.Instagram,
    href: COMPANY_SOCIAL_INSTAGRAM,
    label: "Instagram",
    icon: faInstagram,
  },
];

export function FooterSection({
  description,
  locale,
  navColumn,
}: FooterSectionProps) {
  const copy = getFooterStaticContent(locale);
  const imprintHref = createLocalePathname(SITE_ROUTES.IMPRINT, locale);

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

  const contactColumn = {
    title: copy.contactTitle,
    links: [
      { label: copy.brand, href: `${imprintHref}#company-details` },
      { label: COMPANY.contact.email, href: COMPANY_MAILTO },
      { label: PHONE_DISPLAY[locale], href: COMPANY_TEL },
    ],
  };

  const columns = [
    filteredNavColumn,
    { title: copy.legalTitle, links: copy.legalLinks },
    { title: copy.invessivTitle, links: copy.invessivLinks },
    contactColumn,
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

              <ul className={styles.socials} aria-label={copy.socialsAriaLabel}>
                {SOCIAL_LINKS.map((socialLink) => (
                  <li key={socialLink.platform}>
                    <a
                      aria-label={socialLink.label}
                      className={styles.socialLink}
                      href={socialLink.href}
                    >
                      <FontAwesomeIcon icon={socialLink.icon} />
                    </a>
                  </li>
                ))}
              </ul>
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
