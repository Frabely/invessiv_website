import { HeroVisual } from "@/components/marketing/hero-visual/hero-visual";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";

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
      <div className="hero__noise" />
      <div className="hero__aurora hero__aurora--left" />
      <div className="hero__aurora hero__aurora--right" />

      <div className="hero__grid">
        <div className="hero__content">
          <p className="hero__tag">{heroTag}</p>
          <h1>
            <span className="hero__title-gradient">{title}</span>
          </h1>
          <p>{description}</p>
          <div className="hero__cta-row">
            <a className="btn btn--primary" href="#contact">
              {heroPrimaryCta}
            </a>
            <a className="btn btn--ghost" href="#services">
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
