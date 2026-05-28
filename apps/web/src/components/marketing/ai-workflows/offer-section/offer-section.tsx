"use client";

import { useRef } from "react";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import type { Locale } from "@/config/i18n";
import type { LandingAiOfferContent } from "@/i18n/dictionaries/ai-workflows/offer";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import styles from "./offer-section.module.css";

type OfferSectionProps = LandingAiOfferContent & {
  id: string;
  locale: Locale;
  ctaHref: string;
};

export function OfferSection({
  id,
  locale,
  eyebrow,
  title,
  body,
  deliverablesHeading,
  deliverables,
  proofNote,
  cta,
  ctaHref,
  stepsLabel,
  steps,
}: OfferSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.intro} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
      </div>

      <div className={styles.deliverablesBlock} data-reveal-item="true">
        <p className={styles.deliverablesLabel}>{deliverablesHeading}</p>
        <ul
          aria-label={deliverablesHeading}
          className={styles.deliverablesList}
        >
          {deliverables.map((item) => (
            <li
              className={styles.deliverable}
              data-reveal-item="true"
              key={item.label}
            >
              <span aria-hidden="true" className={styles.checkIcon} />
              <span className={styles.deliverableLabel}>{item.label}</span>
              <span className={styles.deliverableDetail}>{item.detail}</span>
            </li>
          ))}
        </ul>
        <p className={styles.proofNote}>{proofNote}</p>
      </div>

      <div className={styles.stepsRow} data-reveal-item="true">
        <p className={styles.stepsLabel}>{stepsLabel}</p>
        <ol aria-label={stepsLabel} className={styles.stepsList}>
          {steps.map((step) => (
            <li className={styles.stepItem} key={step.label}>
              <span className={styles.stepPill}>{step.label}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.ctaRow} data-reveal-item="true">
        <PrimaryCtaLink href={ctaHref}>{cta}</PrimaryCtaLink>
      </div>
    </section>
  );
}
