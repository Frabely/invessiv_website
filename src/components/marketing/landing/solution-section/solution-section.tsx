"use client";

import { useRef } from "react";

import { SectionMarker } from "@/components/marketing/landing/section-marker/section-marker";
import type { Locale } from "@/config/i18n";
import type { LandingSolutionContent } from "@/i18n/dictionaries/landing/solution";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import { SolutionWireframe } from "./solution-wireframe/solution-wireframe";
import styles from "./solution-section.module.css";

type SolutionSectionProps = LandingSolutionContent & {
  id: string;
  locale: Locale;
};

export function SolutionSection({
  body,
  eyebrow,
  id,
  locale,
  title,
}: SolutionSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.visual}>
        <SolutionWireframe />
      </div>

      <div className={styles.intro} data-reveal-item="true">
        <SectionMarker
          className={styles.marker}
          index="02"
          label={eyebrow}
          total="09"
        />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body} data-reveal-item="true">
          {body}
        </p>
      </div>
    </section>
  );
}
