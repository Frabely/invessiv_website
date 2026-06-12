"use client";

import { faArrowRightLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef, useState } from "react";

import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import type { LandingProblemSolutionContent } from "@/i18n/dictionaries/landing/problem-solution";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import styles from "./problem-solution-section.module.css";

type ProblemSolutionSectionProps = LandingProblemSolutionContent & {
  id: string;
  locale: Locale;
};

function formatPairIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function ProblemSolutionSection({
  body,
  eyebrow,
  id,
  locale,
  pairs,
  problemLabel,
  solutionLabel,
  title,
}: ProblemSolutionSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activePairIndex, setActivePairIndex] = useState<number | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <header className={styles.header} data-reveal-item="true">
        <div className={styles.intro}>
          <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <p className={styles.body}>{body}</p>
      </header>

      <div className={styles.transform}>
        <div className={styles.chaosPanel} data-reveal-item="true">
          <p aria-hidden="true" className={styles.chaosLabel}>
            {problemLabel}
          </p>
          <ul aria-label={problemLabel} className={styles.chaosList}>
            {pairs.map((pair, index) => (
              <li
                className={styles.scrap}
                data-highlight={activePairIndex === index ? "true" : undefined}
                data-reveal-item="true"
                key={pair.problem}
                onMouseEnter={() => setActivePairIndex(index)}
                onMouseLeave={() => setActivePairIndex(null)}
              >
                <span className={styles.scrapCard}>
                  <span aria-hidden="true" className={styles.scrapIndex}>
                    {formatPairIndex(index)}
                  </span>
                  {pair.problem}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <span aria-hidden="true" className={styles.connector}>
          <FontAwesomeIcon aria-hidden="true" icon={faArrowRightLong} />
        </span>

        <div className={styles.clarityPanel} data-reveal-item="true">
          <p aria-hidden="true" className={styles.clarityLabel}>
            {solutionLabel}
          </p>
          <ol aria-label={solutionLabel} className={styles.clarityList}>
            {pairs.map((pair, index) => (
              <li
                className={styles.clarityRow}
                data-highlight={activePairIndex === index ? "true" : undefined}
                data-reveal-item="true"
                key={pair.solution}
                onMouseEnter={() => setActivePairIndex(index)}
                onMouseLeave={() => setActivePairIndex(null)}
              >
                <span aria-hidden="true" className={styles.clarityIndex}>
                  {formatPairIndex(index)}
                </span>
                {pair.solution}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
