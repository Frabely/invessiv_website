"use client";

import { useRef } from "react";

import { SectionMarker } from "@/components/marketing/landing/section-marker/section-marker";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingProcessContent } from "@/i18n/dictionaries/landing/process";
import styles from "./process-section.module.css";

type ProcessSectionProps = LandingProcessContent & {
  id: string;
  locale: Locale;
};

export function ProcessSection({
  body,
  eyebrow,
  id,
  locale,
  steps,
  title,
}: ProcessSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.intro} data-reveal-item="true">
        <SectionMarker
          className={styles.marker}
          index="05"
          label={eyebrow}
          total="09"
        />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
      </div>

      <div className={styles.track} data-reveal-item="true">
        <span aria-hidden="true" className={styles.rail} />
        <ol className={styles.steps}>
          {steps.map((step) => (
            <li
              className={styles.step}
              data-reveal-item="true"
              key={step.numeral}
            >
              <span aria-hidden="true" className={styles.node} />
              <span className={styles.dayLabel}>{step.dayLabel}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
