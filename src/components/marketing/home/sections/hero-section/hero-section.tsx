import { HeroVisual } from "@/components/marketing/hero-visual/hero-visual";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import { SECTION_HREFS } from "@/config/site";

type HeroSectionProps = {
  description: string;
  heroBenefitsAriaLabel: string;
  heroChipTags: string[];
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroTag: string;
  heroVisualAriaLabel: string;
  title: string;
};

export function HeroSection({
  description,
  heroBenefitsAriaLabel,
  heroChipTags,
  heroPrimaryCta,
  heroSecondaryCta,
  heroTag,
  heroVisualAriaLabel,
  title,
}: HeroSectionProps) {
  return (
    <section className="hero" id="hero">
      <div aria-hidden="true" className="hero__vignette" />
      <div aria-hidden="true" className="hero__grid-overlay" />
      <div aria-hidden="true" className="hero__glow hero__glow--text" />
      <div aria-hidden="true" className="hero__glow hero__glow--visual" />
      <div className="hero__noise" />
      <div className="hero__aurora hero__aurora--left" />
      <div className="hero__aurora hero__aurora--right" />

      <div className="hero__grid">
        <div className="hero__content">
          <p className="hero__tag">{heroTag}</p>
          <h1 className="hero__title">
            <span className="hero__title-gradient">{title}</span>
          </h1>
          <p>{description}</p>

          <div className="hero__cta-row">
            <a
              className="btn btn--primary"
              href={SECTION_HREFS.contact}
              data-analytics-event="cta_click"
              data-analytics-location="hero"
              data-analytics-variant="primary"
              data-analytics-target="form"
            >
              {heroPrimaryCta}
            </a>
            <a
              className="btn btn--ghost"
              href={SECTION_HREFS.services}
              data-analytics-event="cta_click"
              data-analytics-location="hero"
              data-analytics-variant="secondary"
            >
              {heroSecondaryCta}
            </a>
          </div>

          <SectionScanPoints
            ariaLabel={heroBenefitsAriaLabel}
            fallbackClassName="hero__tags-fallback"
            points={heroChipTags}
            variant="hero"
          />
        </div>

        <HeroVisual ariaLabel={heroVisualAriaLabel} />
      </div>
    </section>
  );
}
