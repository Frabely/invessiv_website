import type { LandingSectionCopy } from "@/content/landing/home";

type FooterColumn = NonNullable<LandingSectionCopy["footerColumns"]>[number];
type FooterNewsletter = NonNullable<LandingSectionCopy["footerNewsletter"]>;
type FooterHeroCta = NonNullable<LandingSectionCopy["footerHeroPrimaryCta"]>;
type FooterLegalLink = NonNullable<LandingSectionCopy["footerLegalLinks"]>[number];

type FooterSectionProps = {
  bottomNote?: string;
  brand?: string;
  columns: FooterColumn[];
  copyright?: string;
  description: string;
  heroDescription?: string;
  heroPrimaryCta?: FooterHeroCta;
  heroSecondaryCta?: FooterHeroCta;
  heroTitle?: string;
  id: string;
  legalLinks?: FooterLegalLink[];
  newsletter?: FooterNewsletter;
};

export function FooterSection({
  bottomNote,
  brand,
  columns,
  copyright,
  description,
  heroDescription,
  heroPrimaryCta,
  heroSecondaryCta,
  heroTitle,
  id,
  legalLinks = [],
  newsletter,
}: FooterSectionProps) {
  const linkColumns = columns.filter((column) => column.links.length > 0);

  return (
    <footer className="site-footer" id={id}>
      <div className="site-footer__hero">
        {heroTitle ? <h2>{heroTitle}</h2> : null}
        {heroDescription ? <p>{heroDescription}</p> : null}
        <div className="site-footer__hero-actions">
          {heroPrimaryCta ? (
            <a className="btn btn--primary" href={heroPrimaryCta.href}>
              {heroPrimaryCta.label}
            </a>
          ) : null}
          {heroSecondaryCta ? (
            <a className="btn btn--ghost" href={heroSecondaryCta.href}>
              {heroSecondaryCta.label}
            </a>
          ) : null}
        </div>
      </div>

      <p className="site-footer__hint">{description}</p>

      <div className="site-footer__grid" role="list">
        {linkColumns.map((column) => (
          <section className="site-footer__col" key={column.title} role="listitem">
            <h3>{column.title}</h3>
            <ul>
              {column.links.map((link) => (
                <li key={`${column.title}-${link.label}`}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {newsletter ? (
          <section className="site-footer__col site-footer__newsletter" role="listitem">
            <h3>{newsletter.title}</h3>
            <p>{newsletter.description}</p>
            <div className="site-footer__newsletter-input">
              <input placeholder={newsletter.inputPlaceholder} type="email" />
              <button type="button">{newsletter.buttonLabel}</button>
            </div>
            <label>
              <input type="checkbox" />
              <span>{newsletter.consentLabel}</span>
            </label>
          </section>
        ) : null}
      </div>

      <div className="site-footer__bottom">
        <div className="site-footer__bottom-left">
          {brand ? <strong>{brand}</strong> : null}
          {copyright ? <span>{copyright}</span> : null}
        </div>
        {legalLinks.length ? (
          <div className="site-footer__bottom-right">
            {legalLinks.map((link) => (
              <a href={link.href} key={link.label}>
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>

      {bottomNote ? <p className="site-footer__legacy-note">{bottomNote}</p> : null}
    </footer>
  );
}
