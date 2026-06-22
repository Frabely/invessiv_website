"use client";

import { KlarkompassEyebrow } from "@/references/klarkompass-coaching/components/klarkompass-eyebrow/klarkompass-eyebrow";
import {
  Reveal,
  RevealGroup,
} from "@/references/klarkompass-coaching/components/klarkompass-reveal/klarkompass-reveal";
import type { Locale } from "@/config/i18n";
import type { KlarkompassResultsContent } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./results-section.module.css";

type ResultsSectionProps = KlarkompassResultsContent & {
  id: string;
  locale: Locale;
};

export function ResultsSection({
  eyebrow,
  id,
  items,
  title,
}: ResultsSectionProps) {
  return (
    <RevealGroup as="section" className={styles.section} id={id}>
      <Reveal as="div" className={styles.intro}>
        <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
        <h2 className={styles.title}>{title}</h2>
      </Reveal>

      <ul className={styles.grid}>
        {items.map((item) => (
          <Reveal as="li" className={styles.card} key={item.title}>
            <span className={styles.cardMark} aria-hidden="true" />
            <h3 className={styles.cardTitle}>{item.title}</h3>
            <p className={styles.cardText}>{item.description}</p>
          </Reveal>
        ))}
      </ul>
    </RevealGroup>
  );
}
