import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faLinkedinIn,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import type { LandingSectionCopy } from "@/content/landing/home";

type FooterColumn = NonNullable<LandingSectionCopy["footerColumns"]>[number];
type FooterLegalLink = NonNullable<LandingSectionCopy["footerLegalLinks"]>[number];
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
  brand,
  columns,
  copyright,
  id,
  legalLinks = [],
  socialLinks = [],
}: FooterSectionProps) {
  const linkColumns = columns.filter((column) => column.links.length > 0);
  const isPlaceholderHref = (href: string) =>
    href.includes("placeholder") || href.includes("PLATZHALTER");

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
          {linkColumns.map((column) => (
            <section className="site-footer__col" key={column.title} role="listitem">
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <a
                      className={isPlaceholderHref(link.href) ? "is-placeholder-link" : undefined}
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              {(column.title === "Kontakt" || column.title === "Contact") &&
              socialLinks.length ? (
                <ul className="site-footer__socials">
                  {socialLinks.map((socialLink) => (
                    <li key={socialLink.platform}>
                      <a
                        aria-label={socialLink.label}
                        className={`site-footer__social-link${isPlaceholderHref(socialLink.href) ? " is-placeholder-link" : ""}`}
                        href={socialLink.href}
                      >
                        <FontAwesomeIcon icon={getSocialIcon(socialLink.platform)} />
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
              <span className="site-footer__brand">
                <Image
                  src="/brand/icon.svg"
                  alt="Invessiv Logo"
                  width={24}
                  height={24}
                />
                <strong>{brand}</strong>
              </span>
            ) : null}
            {copyright ? <span>{copyright}</span> : null}
          </div>
          {legalLinks.length ? (
            <div className="site-footer__bottom-right">
              {legalLinks.map((link) => (
                <a
                  className={isPlaceholderHref(link.href) ? "is-placeholder-link" : undefined}
                  href={link.href}
                  key={link.label}
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
