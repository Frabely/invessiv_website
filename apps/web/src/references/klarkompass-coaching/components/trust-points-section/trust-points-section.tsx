"use client";

import { KlarkompassEyebrow } from "@/references/klarkompass-coaching/components/klarkompass-eyebrow/klarkompass-eyebrow";
import {
  Reveal,
  RevealGroup,
} from "@/references/klarkompass-coaching/components/klarkompass-reveal/klarkompass-reveal";
import type { Locale } from "@/config/i18n";
import type { KlarkompassTrustContent } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./trust-points-section.module.css";

type TrustPointsSectionProps = KlarkompassTrustContent & {
  id: string;
  locale: Locale;
};

export function TrustPointsSection({
  eyebrow,
  honestNote,
  id,
  points,
  title,
}: TrustPointsSectionProps) {
  return (
    <RevealGroup as="section" className={styles.section} id={id}>
      <Reveal as="div" className={styles.intro}>
        <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
        <h2 className={styles.title}>{title}</h2>
      </Reveal>

      <ul className={styles.points}>
        {points.map((point) => (
          <Reveal as="li" className={styles.point} key={point}>
            <span className={styles.pointMark} aria-hidden="true" />
            <span>{point}</span>
          </Reveal>
        ))}
      </ul>

      <Reveal as="div" className={styles.honestNote}>
        {honestNote}
      </Reveal>
    </RevealGroup>
  );
}
