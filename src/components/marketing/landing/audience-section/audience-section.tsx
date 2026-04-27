"use client";

import { useRef } from "react";

import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingAudienceContent } from "@/i18n/dictionaries/landing/audience";
import { AudienceIcon } from "./audience-icon";
import styles from "./audience-section.module.css";

type AudienceSectionProps = LandingAudienceContent & {
  id: string;
  locale: Locale;
};

export function AudienceSection({
  body,
  eyebrow,
  id,
  items,
  locale,
  title,
}: AudienceSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.intro} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
      </div>

      <ol className={styles.list} data-reveal-item="true">
        {items.map((item) => (
          <li className={styles.row} data-reveal-item="true" key={item.label}>
            <span aria-hidden="true" className={styles.rowIcon}>
              <AudienceIcon iconKey={item.iconKey} />
            </span>
            <div className={styles.rowBody}>
              <span className={styles.rowLabel}>{item.label}</span>
              <span className={styles.rowScenario}>{item.scenario}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
