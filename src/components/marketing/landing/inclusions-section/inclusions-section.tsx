"use client";

import { useRef } from "react";

import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
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
  itemsLabel,
  locale,
  reassurance,
  title,
}: InclusionsSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.intro} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
      </div>

      <div className={styles.deliverables} data-reveal-item="true">
        <p className={styles.deliverablesLabel}>{itemsLabel}</p>
        <ul className={styles.itemList} aria-label={itemsLabel}>
          {items.map((item, index) => (
            <li className={styles.item} data-reveal-item="true" key={item}>
              <span aria-hidden="true" className={styles.itemIndex}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.itemLabel}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.reassurance} data-reveal-item="true">
        <span aria-hidden="true" className={styles.reassuranceIcon}>
          <svg
            fill="none"
            height="20"
            viewBox="0 0 24 24"
            width="20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12.5l4.2 4 9.3-9.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
            />
          </svg>
        </span>
        <span>{reassurance}</span>
      </p>
    </section>
  );
}
