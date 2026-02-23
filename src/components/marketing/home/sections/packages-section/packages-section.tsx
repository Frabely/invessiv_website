import type { LandingSectionCopy } from "@/content/landing/home";

type PackageCard = NonNullable<LandingSectionCopy["packageCards"]>[number];
type PackageSectionCta = NonNullable<LandingSectionCopy["packageSectionCta"]>;

type PackagesSectionProps = {
  assurances?: string[];
  description: string;
  disclaimer?: string;
  id: string;
  packageCards: PackageCard[];
  sectionCta?: PackageSectionCta;
  summary?: string;
  title: string;
};

export function PackagesSection({
  assurances = [],
  description,
  disclaimer,
  id,
  packageCards,
  sectionCta,
  summary,
  title,
}: PackagesSectionProps) {
  return (
    <section className="packages-section" id={id}>
      <h2>{title}</h2>
      <p className="packages-hint">{description}</p>
      {summary ? (
        <p className="packages-summary" role="status">
          {summary}
        </p>
      ) : null}
      {assurances.length ? (
        <div className="packages-assurance-row" role="list">
          {assurances.map((assurance) => (
            <span className="packages-assurance-chip" key={assurance} role="listitem">
              {assurance}
            </span>
          ))}
        </div>
      ) : null}

      <div className="packages-grid" role="list">
        {packageCards.map((pkg) => (
          <article
            className={`packages-card ${pkg.featured ? "packages-card--featured" : ""}`}
            key={pkg.name}
            role="listitem"
          >
            <div className="packages-card-head">
              <h3>{pkg.name}</h3>
              {pkg.badge ? <span className="packages-badge">{pkg.badge}</span> : null}
            </div>

            <p className="packages-ideal">{pkg.idealFor}</p>
            <p className="packages-price">{pkg.price}</p>
            <p className="packages-timeline">{pkg.timeline}</p>

            <ul className="packages-scope">
              {pkg.scope.map((scopeItem) => (
                <li key={scopeItem}>{scopeItem}</li>
              ))}
            </ul>

            <a className="packages-cta" href={pkg.ctaHref}>
              {pkg.ctaLabel}
            </a>
          </article>
        ))}
      </div>

      {sectionCta ? (
        <aside className="packages-outro-cta">
          <a className="btn btn--primary" href={sectionCta.href}>
            {sectionCta.label}
          </a>
          <p>{sectionCta.hint}</p>
        </aside>
      ) : null}

      {disclaimer ? <p className="packages-disclaimer">{disclaimer}</p> : null}
    </section>
  );
}
