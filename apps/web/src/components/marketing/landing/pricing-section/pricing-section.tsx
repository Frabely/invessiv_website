"use client";

import { useRef } from "react";

import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
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
      <span aria-hidden="true" className={styles.spotlight} />

      <div className={styles.intro} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
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
