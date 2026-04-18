import { HeroVisual } from "@/components/marketing/hero-visual/hero-visual";
import heroVisualStyles from "@/components/marketing/hero-visual/hero-visual.module.css";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import buttonStyles from "@/components/shared/button/button.module.css";
import { SECTION_HREFS } from "@/config/site";
import styles from "./hero-section.module.css";

type HeroSectionProps = {
  description: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroTag: string;
  heroVisualAriaLabel: string;
  title: string;
};

export function HeroSection({
  description,
  heroPrimaryCta,
  heroSecondaryCta,
  heroTag,
  heroVisualAriaLabel,
  title,
}: HeroSectionProps) {
  return (
    <section className={`${styles.root} hero`} id="hero">
      <div aria-hidden="true" className={styles.backgroundLayers}>
        <div className={heroVisualStyles.vignette} />
        <div className={heroVisualStyles.gridOverlay} />
        <div className={heroVisualStyles.noise} />
      </div>

      <div className={styles.grid}>
        <div className={styles.content}>
          <EyebrowPill className={styles.tag}>{heroTag}</EyebrowPill>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>{title}</span>
          </h1>
          <p className={styles.description}>{description}</p>

          <div className={styles.ctaRow}>
            <PrimaryCtaLink
              className={`${styles.ctaButton} ${styles.primaryCta}`}
              href={SECTION_HREFS.contact}
              data-analytics-event="cta_click"
              data-analytics-location="hero"
              data-analytics-variant="primary"
              data-analytics-target="form"
            >
              {heroPrimaryCta}
            </PrimaryCtaLink>
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
        </div>

        <HeroVisual ariaLabel={heroVisualAriaLabel} />
      </div>
    </section>
  );
}
