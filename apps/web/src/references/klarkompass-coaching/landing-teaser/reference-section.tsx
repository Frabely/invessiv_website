"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import klarkompassPreview from "../assets/klarkompass-preview.png";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingReferenceContent } from "@/references/klarkompass-coaching/i18n/landing-teaser";
import styles from "./reference-section.module.css";

type ReferenceSectionProps = LandingReferenceContent & {
  demoHref: string;
  id: string;
  locale: Locale;
};

export function ReferenceSection({
  browserLabel,
  conceptBadge,
  demoHref,
  description,
  eyebrow,
  highlights,
  id,
  linkLabel,
  locale,
  previewAlt,
  title,
}: ReferenceSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <span aria-hidden="true" className={styles.spotlight} />

      <div className={styles.grid}>
        <div className={styles.content} data-reveal-item="true">
          <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>

          <ul className={styles.highlights}>
            {highlights.map((highlight) => (
              <li className={styles.highlight} key={highlight}>
                <span className={styles.highlightMark} aria-hidden="true" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>

          <Link
            className={styles.link}
            data-analytics-event="cta_click"
            data-analytics-location="reference"
            data-analytics-target="reference"
            data-analytics-variant="secondary"
            href={demoHref}
          >
            {linkLabel}
            <span aria-hidden="true" className={styles.linkArrow}>
              →
            </span>
          </Link>
        </div>

        <div className={styles.visual} data-reveal-item="true">
          <div className={styles.conceptBadge}>{conceptBadge}</div>
          <div className={styles.browserFrame}>
            <div className={styles.browserChrome} aria-hidden="true">
              <span className={styles.chromeDot} />
              <span className={styles.chromeDot} />
              <span className={styles.chromeDot} />
              <span className={styles.chromeBar}>{browserLabel}</span>
            </div>
            <div className={styles.browserViewport}>
              <Image
                alt={previewAlt}
                className={styles.previewImage}
                height={832}
                sizes="(max-width: 960px) 100vw, 50vw"
                src={klarkompassPreview}
                width={1280}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
