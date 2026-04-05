import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faLinkedinIn,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import { SECTION_HREFS } from "@/config/site";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";

type FooterColumn = NonNullable<LandingSectionCopy["footerColumns"]>[number];
type FooterLegalLink = NonNullable<
  LandingSectionCopy["footerLegalLinks"]
>[number];
type FooterSocialLink = NonNullable<
  LandingSectionCopy["footerSocialLinks"]
>[number];

type FooterSectionProps = {
  bottomNote?: string;
  brand?: string;
  columns: FooterColumn[];
  copyright?: string;
  description: string;
  id: string;
  legalLinks?: FooterLegalLink[];
  socialLinks?: FooterSocialLink[];
};

export function FooterSection({
  bottomNote,
  brand,
  columns,
  copyright,
  id,
  legalLinks = [],
  socialLinks = [],
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
  const legalColumnTitle = legalLinks.some((link) => link.label === "Impressum")
    ? "Rechtliches"
    : "Legal";
  const linkColumns = columns
    .map((column) => ({
      ...column,
      links: column.links.filter((link) => !isPlaceholderHref(link.href)),
    }))
    .filter((column) => column.links.length > 0);
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
    if (platform === "linkedin") {
      return faLinkedinIn;
    }
    if (platform === "instagram") {
      return faInstagram;
    }
    return faXTwitter;
  };

  return (
    <footer className="site-footer" id={id}>
      <div className="site-footer__inner">
        <div className="site-footer__grid" role="list">
          {footerColumnsWithLegal.map((column) => (
            <section
              className={`site-footer__col${column.title === legalColumnTitle ? " site-footer__col--legal" : ""}`}
              key={column.title}
              role="listitem"
            >
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <a
                      className={
                        isPlaceholderHref(link.href)
                          ? "is-placeholder-link"
                          : undefined
                      }
                      href={link.href}
                      {...getLinkAnalyticsProps(link.href)}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              {(column.title === "Kontakt" || column.title === "Contact") &&
              visibleSocialLinks.length ? (
                <ul className="site-footer__socials">
                  {visibleSocialLinks.map((socialLink) => (
                    <li key={socialLink.platform}>
                      <a
                        aria-label={socialLink.label}
                        className="site-footer__social-link"
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
          ))}
        </div>

        <div className="site-footer__bottom">
          <div className="site-footer__bottom-left">
            {brand ? (
              <div className="site-footer__brand-wrap">
                <span className="site-footer__brand">
                  <Image
                    src="/brand/icon.png"
                    alt="Invessiv Logo"
                    width={24}
                    height={24}
                  />
                  <strong>{brand}</strong>
                </span>
                {bottomNote ? (
                  <small className="site-footer__owner-note">
                    {bottomNote}
                  </small>
                ) : null}
              </div>
            ) : null}
            {copyright ? <span>{copyright}</span> : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
