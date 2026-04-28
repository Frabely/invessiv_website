"use client";

import { useRef } from "react";

import { SectionMarker } from "@/components/marketing/landing/section-marker/section-marker";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingInclusionsContent } from "@/i18n/dictionaries/landing/inclusions";
import styles from "./inclusions-section.module.css";

type InclusionsSectionProps = LandingInclusionsContent & {
  id: string;
  locale: Locale;
};

export function InclusionsSection({
  body,
  eyebrow,
  id,
  items,
  locale,
  reassurance,
  title,
}: InclusionsSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  const [heroItem, ...rest] = items;

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.intro} data-reveal-item="true">
        <SectionMarker
          className={styles.marker}
          index="03"
          label={eyebrow}
          total="09"
        />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
      </div>

      <div className={styles.bento} data-reveal-item="true">
        {heroItem ? (
          <article
            className={`${styles.tile} ${styles.heroTile}`}
            data-reveal-item="true"
          >
            <span aria-hidden="true" className={styles.tileNumber}>
              01
            </span>
            <h3 className={styles.tileHeadline}>{heroItem.headline}</h3>
            {heroItem.detail ? (
              <p className={styles.tileDetail}>{heroItem.detail}</p>
            ) : null}
          </article>
        ) : null}

        {rest.map((item, index) => (
          <article
            className={styles.tile}
            data-reveal-item="true"
            key={item.headline}
          >
            <span aria-hidden="true" className={styles.tileNumber}>
              {String(index + 2).padStart(2, "0")}
            </span>
            <h3 className={styles.tileHeadline}>{item.headline}</h3>
          </article>
        ))}
      </div>

      <p className={styles.reassurance} data-reveal-item="true">
        {reassurance}
      </p>
    </section>
  );
}
