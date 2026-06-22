"use client";

import { KlarkompassEyebrow } from "@/references/klarkompass-coaching/components/klarkompass-eyebrow/klarkompass-eyebrow";
import {
  Reveal,
  RevealGroup,
} from "@/references/klarkompass-coaching/components/klarkompass-reveal/klarkompass-reveal";
import type { Locale } from "@/config/i18n";
import type { KlarkompassAboutContent } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./about-section.module.css";

type AboutSectionProps = KlarkompassAboutContent & {
  id: string;
  locale: Locale;
};

export function AboutSection({
  bio,
  eyebrow,
  id,
  name,
  portraitAlt,
  role,
  title,
  values,
  valuesLabel,
}: AboutSectionProps) {
  return (
    <RevealGroup as="section" className={styles.section} id={id}>
      <div className={styles.grid}>
        <Reveal as="div" className={styles.portrait}>
          <div
            className={styles.portraitCard}
            role="img"
            aria-label={portraitAlt}
          >
            <span className={styles.portraitInitials} aria-hidden="true">
              {name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </span>
          </div>
        </Reveal>

        <Reveal as="div" className={styles.content}>
          <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.name}>
            {name} <span className={styles.role}>· {role}</span>
          </p>
          <p className={styles.bio}>{bio}</p>

          <p className={styles.valuesLabel}>{valuesLabel}</p>
          <ul className={styles.values}>
            {values.map((value) => (
              <li className={styles.value} key={value.title}>
                <span className={styles.valueTitle}>{value.title}</span>
                <span className={styles.valueText}>{value.description}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </RevealGroup>
  );
}
