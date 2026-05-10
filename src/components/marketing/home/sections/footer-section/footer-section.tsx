import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { LeadSocialPlatform } from "@/common/constants/leads/social/lead-social-platforms";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import { SECTION_HREFS } from "@/config/navigation/home";
import type {
  FooterColumnCopy,
  FooterLegalLinkCopy,
  FooterSocialLinkCopy,
} from "@/i18n/dictionaries/marketing/home";
import styles from "./footer-section.module.css";

type FooterColumn = FooterColumnCopy;
type FooterLegalLink = FooterLegalLinkCopy;
type FooterSocialLink = FooterSocialLinkCopy;

type FooterSectionProps = {
  bottomNote?: string;
  brand: string;
  columns: FooterColumn[];
  copyright: string;
  description: string;
  id: string;
  legalLinks: FooterLegalLink[];
  socialLinks: FooterSocialLink[];
};

export function FooterSection({
  bottomNote,
  brand,
  columns,
  copyright,
  description,
  id,
  legalLinks,
  socialLinks,
}: FooterSectionProps) {
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
  const linkColumns = columns
    .map((column) => ({
      ...column,
      links: column.links.filter((link) => !isPlaceholderHref(link.href)),
    }))
    .filter((column) => column.links.length > 0);
  const legalColumnTitle = legalLinks.some((link) => link.label === "Impressum")
    ? "Rechtliches"
    : "Legal";
  const footerColumnsWithLegal = legalLinks.length
    ? [
        ...linkColumns.slice(0, 1),
        {
          title: legalColumnTitle,
          links: legalLinks.filter((link) => !isPlaceholderHref(link.href)),
        },
        ...linkColumns.slice(1),
      ]
    : linkColumns;
  const visibleSocialLinks = socialLinks.filter(
    (link) => !isPlaceholderHref(link.href),
  );

  const getSocialIcon = (platform: FooterSocialLink["platform"]) => {
    if (platform === LeadSocialPlatform.Linkedin) {
      return faLinkedinIn;
    }
    return faInstagram;
  };

  return (
    <footer className={styles.footer} id={id}>
      <div className={styles.inner}>
        <div className={styles.shell}>
          <div className={styles.layout}>
            <section className={styles.identity}>
              <div className={styles.brandWrap}>
                <span className={styles.brand}>
                  <Image
                    src="/brand/icon.png"
                    alt="Invessiv Logo"
                    width={24}
                    height={24}
                  />
                  <strong>{brand}</strong>
                </span>
                {bottomNote ? (
                  <small className={styles.ownerNote}>{bottomNote}</small>
                ) : null}
              </div>

              <p className={styles.description}>{description}</p>

              {visibleSocialLinks.length ? (
                <ul className={styles.socials} aria-label="Social links">
                  {visibleSocialLinks.map((socialLink) => (
                    <li key={socialLink.platform}>
                      <a
                        aria-label={socialLink.label}
                        className={styles.socialLink}
                        href={socialLink.href}
                      >
                        <FontAwesomeIcon
                          icon={getSocialIcon(socialLink.platform)}
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <div className={styles.grid} role="list">
              {footerColumnsWithLegal.map((column) => (
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
              <span>{copyright}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
