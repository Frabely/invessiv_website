"use client";

import { useRef } from "react";

import { SectionMarker } from "@/components/marketing/landing/section-marker/section-marker";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingPricingContent } from "@/i18n/dictionaries/landing/pricing";
import { PricingCard } from "./pricing-card";
import styles from "./pricing-section.module.css";

type PricingSectionProps = LandingPricingContent & {
  ctaHref: string;
  id: string;
  locale: Locale;
};

export function PricingSection({
  body,
  card,
  ctaHref,
  ctaLabel,
  eyebrow,
  hint,
  id,
  locale,
  title,
}: PricingSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.intro} data-reveal-item="true">
        <SectionMarker
          className={styles.marker}
          index="06"
          label={eyebrow}
          total="09"
        />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
      </div>

      <div className={styles.stage} data-reveal-item="true">
        <PricingCard content={card} />
      </div>

      <div className={styles.afterCard} data-reveal-item="true">
        <p className={styles.hint}>{hint}</p>
        <PrimaryCtaLink className={styles.cta} href={ctaHref}>
          {ctaLabel}
        </PrimaryCtaLink>
      </div>
    </section>
  );
}
