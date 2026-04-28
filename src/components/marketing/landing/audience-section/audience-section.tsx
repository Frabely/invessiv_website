"use client";

import { useRef, useState } from "react";

import { SectionMarker } from "@/components/marketing/landing/section-marker/section-marker";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingAudienceContent } from "@/i18n/dictionaries/landing/audience";
import styles from "./audience-section.module.css";

type AudienceSectionProps = LandingAudienceContent & {
  id: string;
  locale: Locale;
};

export function AudienceSection({
  body,
  eyebrow,
  fillerLabel,
  id,
  items,
  locale,
  title,
}: AudienceSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.intro} data-reveal-item="true">
        <SectionMarker
          className={styles.marker}
          index="04"
          label={eyebrow}
          total="09"
        />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
      </div>

      <div className={styles.filter} data-reveal-item="true">
        <p className={styles.fillerLine}>
          <span className={styles.fillerLabel}>{fillerLabel}</span>
          <span aria-hidden="true" className={styles.fillerSlot}>
            {activeItem?.label}
          </span>
        </p>

        <div className={styles.pills} role="group" aria-label={title}>
          {items.map((item, index) => (
            <button
              aria-pressed={index === activeIndex}
              className={styles.pill}
              data-active={index === activeIndex ? "true" : undefined}
              key={item.label}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <p
          aria-live="polite"
          className={styles.example}
          key={activeItem?.label}
        >
          {activeItem?.example}
        </p>
      </div>
    </section>
  );
}
