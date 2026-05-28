"use client";

import { useRef } from "react";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import type { LandingAiProblemExamplesContent } from "@/i18n/dictionaries/ai-workflows/problem-examples";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import styles from "./problem-examples-section.module.css";

type ProblemExamplesSectionProps = LandingAiProblemExamplesContent & {
  id: string;
  locale: Locale;
};

export function ProblemExamplesSection({
  id,
  locale,
  eyebrow,
  title,
  body,
  examplesHeading,
  examples,
  summary,
}: ProblemExamplesSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.copyColumn} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
      </div>

      <div className={styles.examplesPanel} data-reveal-item="true">
        <h3 className={styles.examplesHeading}>{examplesHeading}</h3>
        <ul className={styles.examplesList} aria-label={examplesHeading}>
          {examples.map((example) => (
            <li
              className={styles.examplesItem}
              data-reveal-item="true"
              key={example.text}
            >
              <span aria-hidden="true" className={styles.itemNode} />
              <span className={styles.itemText}>{example.text}</span>
              <span className={styles.itemTime}>{example.time}</span>
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
