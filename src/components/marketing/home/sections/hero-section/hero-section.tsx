import { HeroVisual } from "@/components/marketing/hero-visual/hero-visual";
import heroVisualStyles from "@/components/marketing/hero-visual/hero-visual.module.css";
import { HeroQuickEntry } from "@/components/marketing/landing/hero-quick-entry/hero-quick-entry";
import { SectionMarker } from "@/components/marketing/landing/section-marker/section-marker";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import buttonStyles from "@/components/shared/button/button.module.css";
import { HERO_SECTION_ID } from "@/config/site";
import styles from "./hero-section.module.css";

type HeroQuickEntryConfig = {
  placeholder: string;
  submitAriaLabel: string;
  targetHref: string;
};

type HeroSectionMarkerConfig = {
  index: string;
  label: string;
  total: string;
};

type HeroSectionProps = {
  description: string;
  primaryCtaAnalyticsTarget: string;
  primaryCtaHref: string;
  secondaryCtaAnalyticsTarget?: string;
  secondaryCtaHref?: string;
  trackingLocation: string;
  heroPrimaryCta: string;
  heroSecondaryCta?: string;
  heroTag: string;
  heroTrustLine?: string;
  heroVisualAriaLabel: string;
  quickEntry?: HeroQuickEntryConfig;
  sectionMarker?: HeroSectionMarkerConfig;
  title: string;
};

export function HeroSection({
  description,
  primaryCtaAnalyticsTarget,
  primaryCtaHref,
  secondaryCtaAnalyticsTarget,
  secondaryCtaHref,
  trackingLocation,
  heroPrimaryCta,
  heroSecondaryCta,
  heroTag,
  heroTrustLine,
  heroVisualAriaLabel,
  quickEntry,
  sectionMarker,
  title,
}: HeroSectionProps) {
  return (
    <section className={`${styles.root} hero`} id={HERO_SECTION_ID}>
      <div aria-hidden="true" className={styles.backgroundLayers}>
        <div className={heroVisualStyles.vignette} />
        <div className={heroVisualStyles.gridOverlay} />
        <div className={heroVisualStyles.noise} />
      </div>

      <div className={styles.grid}>
        <div className={styles.content}>
          {sectionMarker ? (
            <SectionMarker
              className={styles.marker}
              index={sectionMarker.index}
              label={sectionMarker.label}
              total={sectionMarker.total}
            />
          ) : null}
          <EyebrowPill className={styles.tag}>{heroTag}</EyebrowPill>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>{title}</span>
          </h1>
          <p className={styles.description}>{description}</p>

          <div className={styles.ctaRow}>
            <PrimaryCtaLink
              className={`${styles.ctaButton} ${styles.primaryCta}`}
              href={primaryCtaHref}
              data-analytics-event="cta_click"
              data-analytics-location={trackingLocation}
              data-analytics-variant="primary"
              data-analytics-target={primaryCtaAnalyticsTarget}
            >
              {heroPrimaryCta}
            </PrimaryCtaLink>
            {quickEntry ? (
              <HeroQuickEntry
                placeholder={quickEntry.placeholder}
                submitAriaLabel={quickEntry.submitAriaLabel}
                targetHref={quickEntry.targetHref}
              />
            ) : heroSecondaryCta && secondaryCtaHref ? (
              <a
                className={`${buttonStyles.button} ${buttonStyles.ghost} ${styles.ctaButton}`}
                href={secondaryCtaHref}
                data-analytics-event="cta_click"
                data-analytics-location={trackingLocation}
                data-analytics-variant="secondary"
                data-analytics-target={secondaryCtaAnalyticsTarget}
              >
                {heroSecondaryCta}
              </a>
            ) : null}
          </div>

          {heroTrustLine ? (
            <p className={styles.trustLine}>{heroTrustLine}</p>
          ) : null}
        </div>

        <HeroVisual ariaLabel={heroVisualAriaLabel} />
      </div>
    </section>
  );
}
