"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import Image from "next/image";
import proofImage from "@/references/klarkompass-coaching/assets/proof-image.png";
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

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const mediaVariants: Variants = {
  hidden: { opacity: 0, scale: 1.05 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.85, ease: EASE } },
};

/* The "Kein Theater" mark presses in like a stamp once the photo has settled. */
const stampVariants: Variants = {
  hidden: { opacity: 0, scale: 1.18 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: EASE, delay: 0.5 },
  },
};

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const staticVariants: Variants = {
  hidden: { opacity: 1, y: 0, scale: 1 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export function TrustPointsSection({
  eyebrow,
  honestNote,
  id,
  imageAlt,
  locale,
  photoNote,
  points,
  proofLabel,
  title,
}: TrustPointsSectionProps) {
  const reduce = useReducedMotion();
  const media = reduce ? staticVariants : mediaVariants;
  const stamp = reduce ? staticVariants : stampVariants;
  const list = reduce ? staticVariants : listVariants;
  const item = reduce ? staticVariants : itemVariants;

  return (
    <section className={styles.section} id={id} lang={locale}>
      <RevealGroup as="div" className={styles.head}>
        <Reveal as="div" className={styles.headInner}>
          <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
          <h2 className={styles.title}>{title}</h2>
        </Reveal>
      </RevealGroup>

      <div className={styles.body}>
        <motion.figure
          className={styles.figure}
          initial="hidden"
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          whileInView="show"
        >
          <motion.div className={styles.media} variants={media}>
            <Image
              alt={imageAlt}
              className={styles.img}
              fill
              placeholder="blur"
              sizes="(min-width: 900px) 40rem, 100vw"
              src={proofImage}
            />
            <span className={styles.photoTag}>{photoNote}</span>
            <motion.span className={styles.stamp} variants={stamp}>
              <span aria-hidden="true" className={styles.stampMark} />
              {proofLabel}
            </motion.span>
          </motion.div>
        </motion.figure>

        <motion.ul
          className={styles.points}
          initial="hidden"
          variants={list}
          viewport={{ once: true, margin: "0px 0px -18% 0px" }}
          whileInView="show"
        >
          {points.map((point) => (
            <motion.li
              className={styles.point}
              key={point.title}
              variants={item}
            >
              <span aria-hidden="true" className={styles.pointMark} />
              <h3 className={styles.pointTitle}>{point.title}</h3>
              <p className={styles.pointText}>{point.description}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      <RevealGroup as="div">
        <Reveal as="div">
          <p className={styles.footnote}>{honestNote}</p>
        </Reveal>
      </RevealGroup>
    </section>
  );
}
