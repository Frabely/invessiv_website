import { HeroVisual } from "@/components/marketing/hero-visual/hero-visual";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import buttonStyles from "@/components/shared/button/button.module.css";
import { HERO_SECTION_ID } from "@/config/navigation/home";
import { HeroBackground } from "./hero-background/hero-background";
import styles from "./hero-section.module.css";

type HeroSectionBaseProps = {
  compactMobile?: boolean;
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
  heroVideoSrc?: string;
  title: string;
  visualBleed?: boolean;
};

type HeroSectionProps = HeroSectionBaseProps &
  (
    | {
        heroVisualAriaLabel: string;
        visualSlot?: never;
      }
    | {
        heroVisualAriaLabel?: never;
        visualSlot: import("react").ReactNode;
      }
  );

export function HeroSection(props: HeroSectionProps) {
  const visual =
    props.heroVisualAriaLabel !== undefined ? (
      <HeroVisual ariaLabel={props.heroVisualAriaLabel} />
    ) : (
      props.visualSlot
    );
  const {
    compactMobile = false,
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
    heroVideoSrc,
    title,
    visualBleed = false,
  } = props;
  return (
    <section
      className={`${styles.root} ${compactMobile ? styles.compactMobile : ""} ${visualBleed ? styles.visualBleed : ""} hero`}
      id={HERO_SECTION_ID}
    >
      <HeroBackground videoSrc={heroVideoSrc} />

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
              href={primaryCtaHref}
              data-analytics-event="cta_click"
              data-analytics-location={trackingLocation}
              data-analytics-variant="primary"
              data-analytics-target={primaryCtaAnalyticsTarget}
            >
              {heroPrimaryCta}
            </PrimaryCtaLink>
            <a
              className={`${buttonStyles.button} ${buttonStyles.ghost} ${styles.ctaButton} ${styles.secondaryCta}`}
              href={secondaryCtaHref}
              data-analytics-event="cta_click"
              data-analytics-location={trackingLocation}
              data-analytics-variant="secondary"
              data-analytics-target={secondaryCtaAnalyticsTarget}
            >
              {heroSecondaryCta}
            </a>
          </div>

          {heroTrustLine ? (
            <p className={styles.trustLine}>{heroTrustLine}</p>
          ) : null}
        </div>

        {visual}
      </div>
    </section>
  );
}
