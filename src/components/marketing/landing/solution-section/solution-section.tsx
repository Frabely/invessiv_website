"use client";

import { useRef } from "react";

import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import type { LandingSolutionContent } from "@/i18n/dictionaries/landing/solution";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import { SolutionGraphic } from "./solution-graphic/solution-graphic";
import styles from "./solution-section.module.css";

type SolutionSectionProps = LandingSolutionContent & {
  id: string;
  locale: Locale;
};

export function SolutionSection({
  body,
  eyebrow,
  graphic,
  id,
  locale,
  title,
}: SolutionSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.intro} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body} data-reveal-item="true">
          {body}
        </p>
      </div>

      <SolutionGraphic content={graphic} />
    </section>
  );
}
