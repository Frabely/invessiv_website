"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import Image from "next/image";
import aboutImage from "@/references/klarkompass-coaching/assets/about_references_mockup.png";
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

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function AboutSection({
  bio,
  eyebrow,
  id,
  name,
  photoNote,
  portraitAlt,
  role,
  title,
  values,
  valuesLabel,
}: AboutSectionProps) {
  const reduce = useReducedMotion();

  /* The photo unveils with a clip wipe + slow settle. */
  const media: Variants = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { clipPath: "inset(0 0 100% 0)", scale: 1.06 },
        show: {
          clipPath: "inset(0 0 0% 0)",
          scale: 1,
          transition: { duration: 0.9, ease: EASE },
        },
      };

  const panel: Variants = reduce
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 28 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay: 0.35, ease: EASE },
        },
      };

  return (
    <section className={styles.section} id={id}>
      <div className={styles.figure}>
        <motion.div
          className={styles.media}
          initial="hidden"
          variants={media}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          whileInView="show"
        >
          <Image
            alt={portraitAlt}
            className={styles.img}
            fill
            placeholder="blur"
            sizes="(min-width: 880px) 72rem, 100vw"
            src={aboutImage}
          />
          <span className={styles.photoTag}>{photoNote}</span>
        </motion.div>

        <div className={styles.panelAnchor}>
          <motion.div
            className={styles.panel}
            initial="hidden"
            variants={panel}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            whileInView="show"
          >
            <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.byline}>
              <span className={styles.name}>{name}</span>
              <span className={styles.role}>{role}</span>
            </p>
            <p className={styles.bio}>{bio}</p>
          </motion.div>
        </div>
      </div>

      <RevealGroup as="div" className={styles.principles}>
        <Reveal as="div" className={styles.principlesHead}>
          <p className={styles.principlesLabel}>{valuesLabel}</p>
        </Reveal>
        <Reveal as="ul" className={styles.principleList}>
          {values.map((value) => (
            <li className={styles.principle} key={value.title}>
              <span aria-hidden="true" className={styles.principleMark} />
              <h3 className={styles.principleTitle}>{value.title}</h3>
              <p className={styles.principleText}>{value.description}</p>
            </li>
          ))}
        </Reveal>
      </RevealGroup>
    </section>
  );
}
