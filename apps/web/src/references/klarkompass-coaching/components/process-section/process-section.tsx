"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { KlarkompassEyebrow } from "@/references/klarkompass-coaching/components/klarkompass-eyebrow/klarkompass-eyebrow";
import type { Locale } from "@/config/i18n";
import type { KlarkompassProcessContent } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./process-section.module.css";

type ProcessSectionProps = KlarkompassProcessContent & {
  id: string;
  locale: Locale;
};

const sectionVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const staticVariants: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
};

export function ProcessSection({
  compassCaption,
  compassLabel,
  eyebrow,
  id,
  lead,
  locale,
  note,
  noteLabel,
  steps,
  title,
}: ProcessSectionProps) {
  const reduce = useReducedMotion();
  const variants = reduce ? staticVariants : revealVariants;

  return (
    <motion.section
      className={styles.section}
      id={id}
      initial="hidden"
      lang={locale}
      variants={reduce ? staticVariants : sectionVariants}
      viewport={{ once: true, margin: "0px 0px -16% 0px" }}
      whileInView="show"
    >
      <motion.div className={styles.intro} variants={variants}>
        <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.lead}>{lead}</p>
      </motion.div>

      <div className={styles.map}>
        <motion.div className={styles.compassPanel} variants={variants}>
          <div aria-hidden="true" className={styles.compass}>
            <span className={styles.compassRing} />
            <span className={styles.compassNeedle} />
            <span className={styles.compassPin} />
            <span className={styles.compassMarkNorth}>N</span>
            <span className={styles.compassMarkEast}>E</span>
            <span className={styles.compassMarkSouth}>S</span>
            <span className={styles.compassMarkWest}>W</span>
            <span className={styles.compassCenter}>{compassLabel}</span>
          </div>
          <p className={styles.compassCaption}>{compassCaption}</p>
        </motion.div>

        <div className={styles.route} aria-hidden="true">
          <svg
            className={styles.routeSvg}
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <path
              className={styles.routeTrack}
              d="M8 14 C30 8 31 35 50 34 C73 32 68 58 91 55 C76 72 58 64 51 86 C35 73 23 86 10 70"
              vectorEffect="non-scaling-stroke"
            />
            <motion.path
              className={styles.routeDraw}
              d="M8 14 C30 8 31 35 50 34 C73 32 68 58 91 55 C76 72 58 64 51 86 C35 73 23 86 10 70"
              initial={{ pathLength: reduce ? 1 : 0 }}
              transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
              vectorEffect="non-scaling-stroke"
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "0px 0px -20% 0px" }}
            />
          </svg>
        </div>

        <ol className={styles.steps}>
          {steps.map((step) => (
            <motion.li
              className={styles.step}
              key={step.number}
              variants={variants}
            >
              <div className={styles.stepMeta}>
                <span className={styles.stepNumber}>{step.number}</span>
                <span className={styles.stepBearing}>{step.bearing}</span>
              </div>
              <p className={styles.stepKicker}>{step.kicker}</p>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.description}</p>
              <p className={styles.stepOutcome}>{step.outcome}</p>
            </motion.li>
          ))}
        </ol>

        <motion.aside className={styles.note} variants={variants}>
          <p className={styles.noteLabel}>{noteLabel}</p>
          <p className={styles.noteText}>{note}</p>
        </motion.aside>
      </div>
    </motion.section>
  );
}
