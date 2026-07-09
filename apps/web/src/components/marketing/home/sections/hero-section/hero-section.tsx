import type { ReactNode } from "react";

import { HeroVisual } from "@/components/marketing/hero-visual/hero-visual";
import heroVisualStyles from "@/components/marketing/hero-visual/hero-visual.module.css";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import buttonStyles from "@/components/shared/button/button.module.css";
import { HERO_SECTION_ID } from "@/config/navigation/home";
import styles from "./hero-section.module.css";

type HeroSectionProps = {
  compactMobile?: boolean;
  decorative?: boolean;
  description: string;
  primaryCtaAnalyticsTarget: string;
  primaryCtaHref: string;
  secondaryCtaAnalyticsTarget: string;
  secondaryCtaHref: string;
  trackingLocation: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroTag: string;
  heroTrustLine?: string;
  heroVisualAriaLabel: string;
  heroVideoSrc?: string;
  title: string;
  visualSlot?: ReactNode;
};

export function HeroSection({
  compactMobile = false,
  decorative = false,
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
  heroVideoSrc,
  title,
  visualSlot,
}: HeroSectionProps) {
  const primaryCtaClassName = `${styles.ctaButton} ${styles.primaryCta}`;
  const secondaryCtaClassName = `${buttonStyles.button} ${buttonStyles.ghost} ${styles.ctaButton} ${styles.secondaryCta}`;

  return (
    <section
      className={`${styles.root} ${compactMobile ? styles.compactMobile : ""} hero`}
      id={decorative ? undefined : HERO_SECTION_ID}
    >
      <div aria-hidden="true" className={styles.backgroundLayers}>
        {heroVideoSrc ? (
          <video
            aria-hidden="true"
            autoPlay
            className={styles.backgroundVideo}
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src={heroVideoSrc} type="video/mp4" />
          </video>
        ) : null}
        <div className={heroVisualStyles.vignette} />
        {heroVideoSrc ? null : <div className={heroVisualStyles.gridOverlay} />}
        <div className={heroVisualStyles.noise} />
      </div>

      <div className={styles.grid}>
        <div className={styles.content}>
          <EyebrowPill className={styles.tag}>{heroTag}</EyebrowPill>
          {decorative ? (
            <p className={styles.title}>
              <span className={styles.titleGradient}>{title}</span>
            </p>
          ) : (
            <h1 className={styles.title}>
              <span className={styles.titleGradient}>{title}</span>
            </h1>
          )}
          <p className={styles.description}>{description}</p>

          <div className={styles.ctaRow}>
            {decorative ? (
              <>
                <span
                  className={`${buttonStyles.button} ${buttonStyles.primary} ${primaryCtaClassName}`}
                >
                  {heroPrimaryCta}
                </span>
                <span className={secondaryCtaClassName}>
                  {heroSecondaryCta}
                </span>
              </>
            ) : (
              <>
                <PrimaryCtaLink
                  className={primaryCtaClassName}
                  href={primaryCtaHref}
                  data-analytics-event="cta_click"
                  data-analytics-location={trackingLocation}
                  data-analytics-variant="primary"
                  data-analytics-target={primaryCtaAnalyticsTarget}
                >
                  {heroPrimaryCta}
                </PrimaryCtaLink>
                <a
                  className={secondaryCtaClassName}
                  href={secondaryCtaHref}
                  data-analytics-event="cta_click"
                  data-analytics-location={trackingLocation}
                  data-analytics-variant="secondary"
                  data-analytics-target={secondaryCtaAnalyticsTarget}
                >
                  {heroSecondaryCta}
                </a>
              </>
            )}
          </div>

          {heroTrustLine ? (
            <p className={styles.trustLine}>{heroTrustLine}</p>
          ) : null}
        </div>

        {visualSlot ?? (
          <HeroVisual ariaLabel={heroVisualAriaLabel} decorative={decorative} />
        )}
      </div>
    </section>
  );
}
