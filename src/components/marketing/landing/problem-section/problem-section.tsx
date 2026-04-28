"use client";

import { useRef } from "react";

import { SectionMarker } from "@/components/marketing/landing/section-marker/section-marker";
import type { Locale } from "@/config/i18n";
import type { LandingProblemContent } from "@/i18n/dictionaries/landing/problem";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import styles from "./problem-section.module.css";

type ProblemSectionProps = LandingProblemContent & {
  id: string;
  locale: Locale;
};

export function ProblemSection({
  body,
  eyebrow,
  id,
  locale,
  points,
  summary,
  title,
}: ProblemSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.copyColumn} data-reveal-item="true">
        <SectionMarker
          className={styles.marker}
          index="01"
          label={eyebrow}
          total="09"
        />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
      </div>

      <div className={styles.issuePanel} data-reveal-item="true">
        <ul className={styles.issueList} aria-label={summary}>
          {points.map((point) => (
            <li
              className={styles.issueItem}
              data-reveal-item="true"
              key={point}
            >
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <p className={styles.summary} data-reveal-item="true">
          {summary}
        </p>
      </div>
    </section>
  );
}
