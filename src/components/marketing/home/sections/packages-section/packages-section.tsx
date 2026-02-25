"use client";

import type { LandingSectionCopy } from "@/content/landing/home";

type PackageCard = NonNullable<LandingSectionCopy["packageCards"]>[number];

type PackagesSectionProps = {
  description: string;
  id: string;
  packageCards: PackageCard[];
  recommendedBadgeLabel?: string;
  title: string;
};

export function PackagesSection({
  description,
  id,
  packageCards,
  recommendedBadgeLabel = "Recommended",
  title,
}: PackagesSectionProps) {
  return (
    <section className="packages-section" id={id}>
      <header className="packages-header">
        <h2>{title}</h2>
        <p className="packages-hint">{description}</p>
      </header>

      <div className="packages-viewport">
        <div aria-label="Package cards" className="packages-track" role="list">
          {packageCards.map((pkg) => (
            <article
              className={`packages-card ${pkg.featured ? "packages-card--featured" : ""}`}
              key={pkg.name}
              role="listitem"
            >
              <div className="packages-card-head">
                {pkg.featured ? (
                  <span className="packages-recommended">
                    {recommendedBadgeLabel}
                  </span>
                ) : null}
                <h3>{pkg.name}</h3>
              </div>

              <p className="packages-ideal">{pkg.idealFor}</p>
              <p className="packages-price">{pkg.price}</p>
              <p className="packages-timeline">{pkg.timeline}</p>

              <ul className="packages-scope">
                {pkg.scope.map((scopeItem) => (
                  <li key={scopeItem}>
                    <span className="packages-check-icon" aria-hidden="true">
                      <svg viewBox="0 0 16 16">
                        <path d="M6.3 10.6 3.7 8l-1.1 1.1 3.7 3.7 7-7L12.2 4.7z" />
                      </svg>
                    </span>
                    {scopeItem}
                  </li>
                ))}
              </ul>

              <div className="packages-actions">
                <a
                  className="packages-cta packages-cta--primary"
                  href={pkg.ctaHref}
                >
                  {pkg.ctaLabel}
                </a>
                {pkg.secondaryCtaLabel ? (
                  <a
                    className="packages-cta packages-cta--ghost"
                    href={pkg.secondaryCtaHref ?? "#services"}
                  >
                    {pkg.secondaryCtaLabel}
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
