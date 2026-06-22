"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import Image from "next/image";
import heroImage from "@/references/klarkompass-coaching/assets/klarkompass-hero-coaching-v2.png";
import { KlarkompassCta } from "@/references/klarkompass-coaching/components/klarkompass-cta/klarkompass-cta";
import type { Locale } from "@/config/i18n";
import type { KlarkompassHeroContent } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./hero-section.module.css";

type HeroSectionProps = KlarkompassHeroContent & {
  id: string;
  locale: Locale;
  mockLabel: string;
  primaryHref: string;
  secondaryHref: string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HeroSection({
  badge,
  bearing,
  id,
  imageAlt,
  mockLabel,
  primaryCtaLabel,
  primaryHref,
  secondaryCtaLabel,
  secondaryHref,
  subtitle,
  title,
  trustLine,
}: HeroSectionProps) {
  const reduce = useReducedMotion();

  const container: Variants = reduce
    ? { hidden: {}, show: {} }
    : {
        hidden: {},
        show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
      };

  const rise: Variants = reduce
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      };

  const titleRise: Variants = reduce
    ? { hidden: { y: "0%" }, show: { y: "0%" } }
    : {
        hidden: { y: "115%" },
        show: { y: "0%", transition: { duration: 0.85, ease: EASE } },
      };

  const media: Variants = reduce
    ? { hidden: { opacity: 1, scale: 1 }, show: { opacity: 1, scale: 1 } }
    : {
        hidden: { opacity: 0, scale: 1.08 },
        show: {
          opacity: 1,
          scale: 1,
          transition: { duration: 1.4, ease: EASE },
        },
      };

  return (
    <motion.section
      animate="show"
      className={styles.section}
      id={id}
      initial="hidden"
      variants={container}
    >
      <motion.div className={styles.media} variants={media}>
        <Image
          alt={imageAlt}
          className={styles.image}
          fill
          placeholder="blur"
          priority
          sizes="100vw"
          src={heroImage}
        />
        <span aria-hidden="true" className={styles.scrim} />
      </motion.div>

      <div className={styles.inner}>
        <div className={styles.content}>
          <motion.div className={styles.meta} variants={rise}>
            <span>{badge}</span>
            <span aria-hidden="true" className={styles.bearing}>
              {bearing.readout}
            </span>
          </motion.div>

          <h1 className={styles.title}>
            <span className={styles.titleMask}>
              <motion.span className={styles.titleLine} variants={titleRise}>
                {title}
              </motion.span>
            </span>
          </h1>

          <motion.p className={styles.subtitle} variants={rise}>
            {subtitle}
          </motion.p>

          <motion.div className={styles.actions} variants={rise}>
            <KlarkompassCta
              href={primaryHref}
              label={primaryCtaLabel}
              mockLabel={mockLabel}
            />
            <KlarkompassCta
              className={styles.secondaryGhost}
              href={secondaryHref}
              label={secondaryCtaLabel}
              variant="secondary"
            />
          </motion.div>

          <motion.p className={styles.trustLine} variants={rise}>
            {trustLine}
          </motion.p>
        </div>
      </div>
    </motion.section>
  );
}
