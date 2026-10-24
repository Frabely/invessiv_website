import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import type { CtaClickedPayload } from "@/common/contracts/analytics/analytics-event-payloads";
import type { TrustPoint } from "@/common/contracts/marketing/trust-point";
import { analyticsAttributes } from "@/common/patterns/analytics/analytics-properties";
import { HeroVisual } from "@/components/marketing/hero-visual/hero-visual";
import { TrustPoints } from "@/components/marketing/shared/trust-points/trust-points";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { GradientText } from "@/components/shared/gradient-text/gradient-text";
import buttonStyles from "@/components/shared/button/button.module.css";
import { HERO_SECTION_ID } from "@/config/navigation/home";
import { HeroBackground } from "./hero-background/hero-background";
import styles from "./hero-section.module.css";

type HeroSectionBaseProps = {
  compactMobile?: boolean;
  description: string;
  primaryCtaAnalytics: CtaClickedPayload;
  primaryCtaHref: string;
  secondaryCtaHref: string;
  secondaryCtaAnalytics: CtaClickedPayload;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroTag: string;
  heroTrustChips?: TrustPoint[];
  heroVideoSrc?: string;
  fullscreenVisual?: boolean;
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
    primaryCtaAnalytics,
    primaryCtaHref,
    secondaryCtaHref,
    secondaryCtaAnalytics,
    heroPrimaryCta,
    heroSecondaryCta,
    heroTag,
    heroTrustChips,
    heroVideoSrc,
    fullscreenVisual = false,
    title,
    visualBleed = false,
  } = props;
  return (
    <section
      className={`${styles.root} ${compactMobile ? styles.compactMobile : ""} ${visualBleed ? styles.visualBleed : ""} ${fullscreenVisual ? styles.fullscreenVisualRoot : ""} hero`}
      id={HERO_SECTION_ID}
    >
      <HeroBackground hideGrid={fullscreenVisual} videoSrc={heroVideoSrc} />
      {fullscreenVisual ? (
        <div className={styles.fullscreenVisual}>{visual}</div>
      ) : null}

      <div className={styles.grid}>
        <div className={styles.content}>
          <EyebrowPill className={styles.tag}>{heroTag}</EyebrowPill>
          <h1 className={styles.title}>
            <GradientText className={styles.titleText}>{title}</GradientText>
          </h1>
          <p className={styles.description}>{description}</p>

          <div className={styles.ctaRow}>
            <PrimaryCtaLink
              className={`${styles.ctaButton} ${styles.primaryCta}`}
              href={primaryCtaHref}
              {...analyticsAttributes(
                AnalyticsEventName.CtaClicked,
                primaryCtaAnalytics,
              )}
            >
              {heroPrimaryCta}
            </PrimaryCtaLink>
            <a
              className={`${buttonStyles.button} ${buttonStyles.ghost} ${styles.ctaButton} ${styles.secondaryCta}`}
              href={secondaryCtaHref}
              {...analyticsAttributes(
                AnalyticsEventName.CtaClicked,
                secondaryCtaAnalytics,
              )}
            >
              {heroSecondaryCta}
            </a>
          </div>

          {heroTrustChips ? (
            <TrustPoints
              className={styles.trustChips}
              points={heroTrustChips}
            />
          ) : null}
        </div>

        {fullscreenVisual ? null : visual}
      </div>
    </section>
  );
}
