"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
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

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function FinalCtaSection({
  bearing,
  ctaLabel,
  description,
  id,
  locale,
  mockAlertMessage,
  mockNote,
  title,
}: FinalCtaSectionProps) {
  const reduce = useReducedMotion();

  const needle: Variants = reduce
    ? { hidden: { rotate: 0 }, show: { rotate: 0 } }
    : {
        hidden: { rotate: -47 },
        show: {
          rotate: 0,
          transition: { duration: 1.2, ease: EASE, delay: 0.1 },
        },
      };

  const lock: Variants = reduce
    ? { hidden: { opacity: 1, scale: 1 }, show: { opacity: 1, scale: 1 } }
    : {
        hidden: { opacity: 0, scale: 0.55 },
        show: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.7, ease: EASE, delay: 0.55 },
        },
      };

  return (
    <RevealGroup as="section" className={styles.section} id={id} lang={locale}>
      <Reveal as="div" className={styles.card}>
        <div aria-hidden="true" className={styles.rail}>
          <span className={styles.railLine} />
          <span className={styles.node}>
            <motion.span className={styles.lock} variants={lock} />
            <svg className={styles.compass} viewBox="0 0 100 100">
              <circle className={styles.rose} cx="50" cy="50" r="40" />
              <line className={styles.tick} x1="50" x2="50" y1="6" y2="16" />
              <line className={styles.tick} x1="50" x2="50" y1="84" y2="94" />
              <line className={styles.tick} x1="6" x2="16" y1="50" y2="50" />
              <line className={styles.tick} x1="84" x2="94" y1="50" y2="50" />
              <motion.g className={styles.needle} variants={needle}>
                <polygon
                  className={styles.needleN}
                  points="50,18 43,50 57,50"
                />
                <polygon
                  className={styles.needleS}
                  points="50,82 43,50 57,50"
                />
              </motion.g>
              <circle className={styles.pivot} cx="50" cy="50" r="5" />
            </svg>
          </span>
        </div>

        <div className={styles.body}>
          <p className={styles.readout}>
            <span className={styles.readoutValue}>{bearing.readout}</span>
            <span className={styles.readoutCaption}>{bearing.caption}</span>
          </p>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>

          <div className={styles.action}>
            <KlarkompassCta
              className={styles.cta}
              href={`#${id}`}
              label={ctaLabel}
              mockAlertMessage={mockAlertMessage}
            />
            <p className={styles.mockNote}>{mockNote}</p>
          </div>
        </div>
      </Reveal>
    </RevealGroup>
  );
}
