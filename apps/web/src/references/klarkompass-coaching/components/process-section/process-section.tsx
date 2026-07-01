"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { KlarkompassEyebrow } from "@/references/klarkompass-coaching/components/klarkompass-eyebrow/klarkompass-eyebrow";
import {
  Reveal,
  RevealGroup,
} from "@/references/klarkompass-coaching/components/klarkompass-reveal/klarkompass-reveal";
import { KlarkompassSpine } from "@/references/klarkompass-coaching/components/klarkompass-spine/klarkompass-spine";
import type { Locale } from "@/config/i18n";
import type { KlarkompassProcessContent } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./process-section.module.css";

type ProcessSectionProps = KlarkompassProcessContent & {
  id: string;
  locale: Locale;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
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
  const list = reduce ? staticVariants : listVariants;
  const item = reduce ? staticVariants : itemVariants;
  const total = String(steps.length).padStart(2, "0");

  return (
    <section className={styles.section} id={id} lang={locale}>
      <RevealGroup as="div" className={styles.intro}>
        <Reveal as="div" className={styles.introInner}>
          <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.lead}>{lead}</p>
        </Reveal>
        <Reveal as="div" className={styles.summary}>
          <span aria-hidden="true" className={styles.summaryMark} />
          <span className={styles.summaryValue}>{compassLabel}</span>
          <span className={styles.summaryCaption}>{compassCaption}</span>
        </Reveal>
      </RevealGroup>

      <div className={styles.routeWrap}>
        <div className={styles.routeBody}>
          <div aria-hidden="true" className={styles.spineRail}>
            <KlarkompassSpine />
          </div>

          <motion.ol
            className={styles.waypoints}
            initial="hidden"
            variants={list}
            viewport={{ once: true, margin: "0px 0px -18% 0px" }}
            whileInView="show"
          >
            {steps.map((step) => (
              <motion.li
                className={styles.waypoint}
                key={step.number}
                variants={item}
              >
                <div aria-hidden="true" className={styles.wpRail}>
                  <span className={styles.node} />
                </div>
                <div className={styles.wpContent}>
                  <div className={styles.wpHead}>
                    <span className={styles.bearing}>{step.bearing}</span>
                    <span className={styles.index}>
                      {step.number} / {total}
                    </span>
                    <span className={styles.kicker}>{step.kicker}</span>
                  </div>
                  <h3 className={styles.wpTitle}>{step.title}</h3>
                  <p className={styles.wpOutcome}>{step.outcome}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>

        <RevealGroup as="div" className={styles.noteWrap}>
          <Reveal as="div">
            <aside className={styles.note}>
              <p className={styles.noteLabel}>{noteLabel}</p>
              <p className={styles.noteText}>{note}</p>
            </aside>
          </Reveal>
        </RevealGroup>
      </div>
    </section>
  );
}
