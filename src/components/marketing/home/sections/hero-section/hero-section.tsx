import { HeroVisual } from "@/components/marketing/hero-visual/hero-visual";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import buttonStyles from "@/components/shared/button/button.module.css";
import { SECTION_HREFS } from "@/config/site";
import styles from "./hero-section.module.css";

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
    <section className={`${styles.root} hero`} id="hero">
      <div aria-hidden="true" className="hero__vignette" />
      <div aria-hidden="true" className="hero__grid-overlay" />
      <div aria-hidden="true" className="hero__glow hero__glow--text" />
      <div aria-hidden="true" className="hero__glow hero__glow--visual" />
      <div className="hero__noise" />
      <div className="hero__aurora hero__aurora--left" />
      <div className="hero__aurora hero__aurora--right" />

      <div className={styles.grid}>
        <div className={styles.content}>
          <p className={styles.tag}>{heroTag}</p>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>{title}</span>
          </h1>
          <p className={styles.description}>{description}</p>

          <div className={styles.ctaRow}>
            <a
              className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.ctaButton} ${styles.primaryCta}`}
              href={SECTION_HREFS.contact}
              data-analytics-event="cta_click"
              data-analytics-location="hero"
              data-analytics-variant="primary"
              data-analytics-target="form"
            >
              {heroPrimaryCta}
            </a>
            <a
              className={`${buttonStyles.button} ${buttonStyles.ghost} ${styles.ctaButton}`}
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
            className={styles.scanPoints}
            points={heroChipTags}
          />
        </div>

        <HeroVisual ariaLabel={heroVisualAriaLabel} />
      </div>
    </section>
  );
}
