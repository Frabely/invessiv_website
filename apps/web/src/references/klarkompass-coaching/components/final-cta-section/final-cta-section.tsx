"use client";

import { KlarkompassCta } from "@/references/klarkompass-coaching/components/klarkompass-cta/klarkompass-cta";
import {
  Reveal,
  RevealGroup,
} from "@/references/klarkompass-coaching/components/klarkompass-reveal/klarkompass-reveal";
import type { Locale } from "@/config/i18n";
import type { KlarkompassFinalCtaContent } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./final-cta-section.module.css";

type FinalCtaSectionProps = KlarkompassFinalCtaContent & {
  id: string;
  locale: Locale;
  mockAlertMessage: string;
};

export function FinalCtaSection({
  ctaLabel,
  description,
  id,
  locale,
  mockAlertMessage,
  mockNote,
  title,
}: FinalCtaSectionProps) {
  return (
    <RevealGroup as="section" className={styles.section} id={id} lang={locale}>
      <Reveal as="div" className={styles.card}>
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>

        <div className={styles.action}>
          <KlarkompassCta
            className={styles.cta}
            href={`#${id}`}
            label={ctaLabel}
            mockAlertMessage={mockAlertMessage}
          />
          <p className={styles.mockNote}>{mockNote}</p>
        </div>
      </Reveal>
    </RevealGroup>
  );
}
