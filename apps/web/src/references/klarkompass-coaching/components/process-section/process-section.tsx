"use client";

import { KlarkompassEyebrow } from "@/references/klarkompass-coaching/components/klarkompass-eyebrow/klarkompass-eyebrow";
import {
  Reveal,
  RevealGroup,
} from "@/references/klarkompass-coaching/components/klarkompass-reveal/klarkompass-reveal";
import type { Locale } from "@/config/i18n";
import type { KlarkompassProcessContent } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./process-section.module.css";

type ProcessSectionProps = KlarkompassProcessContent & {
  id: string;
  locale: Locale;
};

export function ProcessSection({
  eyebrow,
  id,
  steps,
  title,
}: ProcessSectionProps) {
  return (
    <RevealGroup as="section" className={styles.section} id={id}>
      <Reveal as="div" className={styles.intro}>
        <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
        <h2 className={styles.title}>{title}</h2>
      </Reveal>

      <ol className={styles.steps}>
        {steps.map((step) => (
          <Reveal as="li" className={styles.step} key={step.number}>
            <span aria-hidden="true" className={styles.stepNumber}>
              {step.number}
              <span className={styles.stepDegree}>°</span>
            </span>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepText}>{step.description}</p>
          </Reveal>
        ))}
      </ol>
    </RevealGroup>
  );
}
