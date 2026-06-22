"use client";

import { KlarkompassEyebrow } from "@/references/klarkompass-coaching/components/klarkompass-eyebrow/klarkompass-eyebrow";
import {
  Reveal,
  RevealGroup,
} from "@/references/klarkompass-coaching/components/klarkompass-reveal/klarkompass-reveal";
import { KlarkompassSpine } from "@/references/klarkompass-coaching/components/klarkompass-spine/klarkompass-spine";
import type { Locale } from "@/config/i18n";
import type { KlarkompassMethodContent } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./method-section.module.css";

type MethodSectionProps = KlarkompassMethodContent & {
  id: string;
  locale: Locale;
};

export function MethodSection({
  eyebrow,
  id,
  intro,
  steps,
  title,
}: MethodSectionProps) {
  return (
    <RevealGroup as="section" className={styles.section} id={id}>
      <Reveal as="div" className={styles.intro}>
        <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.lead}>{intro}</p>
      </Reveal>

      <div className={styles.timeline}>
        <span aria-hidden="true" className={styles.spineRail}>
          <KlarkompassSpine />
        </span>

        <ol className={styles.steps}>
          {steps.map((step) => (
            <Reveal as="li" className={styles.step} key={step.number}>
              <span aria-hidden="true" className={styles.stepNumber}>
                {step.number}
                <span className={styles.stepDegree}>°</span>
              </span>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.description}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </RevealGroup>
  );
}
