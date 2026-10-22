"use client";

import { useRef } from "react";
import { AnalyticsCtaId } from "@/common/constants/analytics/analytics-cta-id";
import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import { AnalyticsTarget } from "@/common/constants/analytics/analytics-target";
import { analyticsAttributes } from "@/common/patterns/analytics/analytics-properties";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import buttonStyles from "@/components/shared/button/button.module.css";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingAiHeroContent } from "@/i18n/dictionaries/linkedin-post/hero";
import styles from "./hero-section.module.css";

type AiWorkflowsHeroSectionProps = LandingAiHeroContent & {
  primaryCtaHref: string;
  secondaryCtaHref: string;
};

export function AiWorkflowsHeroSection({
  tag,
  title,
  description,
  primaryCta,
  secondaryCta,
  trustChips,
  primaryCtaHref,
  secondaryCtaHref,
}: AiWorkflowsHeroSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, tag, { staggerMs: 60 });

  return (
    <section className={styles.section} id="hero" ref={sectionRef}>
      <div className={styles.content}>
        <div className={styles.tag} data-reveal-item="true" data-visible="true">
          <EyebrowPill>{tag}</EyebrowPill>
        </div>

        <h1
          className={styles.title}
          data-reveal-item="true"
          data-visible="true"
        >
          {title}
        </h1>

        <p
          className={styles.description}
          data-reveal-item="true"
          data-visible="true"
        >
          {description}
        </p>

        <div
          className={styles.ctaRow}
          data-reveal-item="true"
          data-visible="true"
        >
          <PrimaryCtaLink
            className={styles.primaryCta}
            href={primaryCtaHref}
            {...analyticsAttributes(AnalyticsEventName.CtaClicked, {
              cta: AnalyticsCtaId.LinkedInHeroPrimary,
              target: AnalyticsTarget.Generator,
            })}
          >
            {primaryCta}
          </PrimaryCtaLink>
          <a
            className={`${buttonStyles.button} ${buttonStyles.ghost} ${styles.secondaryCta}`}
            href={secondaryCtaHref}
            {...analyticsAttributes(AnalyticsEventName.CtaClicked, {
              cta: AnalyticsCtaId.LinkedInHeroSecondary,
              target: AnalyticsTarget.ContactForm,
            })}
          >
            {secondaryCta}
          </a>
        </div>

        <div
          className={styles.trustChips}
          data-reveal-item="true"
          data-visible="true"
        >
          <SectionScanPoints
            ariaLabel={tag}
            className={styles.trustChipList}
            points={trustChips}
          />
        </div>
      </div>
    </section>
  );
}
