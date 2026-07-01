"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
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

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.04 } },
};

const lineVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/* The new reality literally resolves from blur to focus — KlarKompass = Klarheit. */
const focusVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(7px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const staticVariants: Variants = {
  hidden: { opacity: 1, y: 0, filter: "blur(0px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function ResultsSection({
  eyebrow,
  fromLabel,
  id,
  items,
  title,
  toLabel,
}: ResultsSectionProps) {
  const reduce = useReducedMotion();
  const group = reduce ? staticVariants : groupVariants;
  const line = reduce ? staticVariants : lineVariants;
  const focus = reduce ? staticVariants : focusVariants;

  return (
    <section className={styles.section} id={id}>
      <RevealGroup as="div" className={styles.head}>
        <Reveal as="div" className={styles.headInner}>
          <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
          <h2 className={styles.title}>{title}</h2>
        </Reveal>
      </RevealGroup>

      <ul className={styles.shifts}>
        {items.map((item) => (
          <motion.li
            className={styles.shift}
            initial="hidden"
            key={item.title}
            variants={group}
            viewport={{ once: true, margin: "0px 0px -18% 0px" }}
            whileInView="show"
          >
            <div className={styles.before}>
              <motion.p className={styles.pillar} variants={line}>
                <span aria-hidden="true" className={styles.pillarMark} />
                {item.title}
              </motion.p>
              <motion.div className={styles.fromBlock} variants={line}>
                <span className={styles.stateLabel}>{fromLabel}</span>
                <p className={styles.fromText}>{item.from}</p>
              </motion.div>
            </div>

            <motion.div className={styles.toBlock} variants={focus}>
              <span className={`${styles.stateLabel} ${styles.stateLabelTo}`}>
                {toLabel}
              </span>
              <p className={styles.toText}>{item.to}</p>
            </motion.div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
