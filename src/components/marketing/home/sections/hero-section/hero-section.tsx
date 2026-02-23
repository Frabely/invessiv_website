import { HeroVisual } from "@/components/marketing/hero-visual/hero-visual";

type HeroSectionProps = {
  description: string;
  heroChipTags: string[];
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroTag: string;
  title: string;
};

export function HeroSection({
  description,
  heroChipTags,
  heroPrimaryCta,
  heroSecondaryCta,
  heroTag,
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

          <div className="hero__tags" aria-label="Kurzvorteile">
            {heroChipTags.map((item) => (
              <span className="chip-tag" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
