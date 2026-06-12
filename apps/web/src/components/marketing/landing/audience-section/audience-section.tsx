"use client";

import { useRef } from "react";

import { PrimaryCtaLink } from "@/components/shared/button/button";
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
  cta,
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
      <span aria-hidden="true" className={styles.spotlight} />

      <div className={styles.intro} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
      </div>

      <ul className={styles.pillList} data-reveal-item="true">
        {items.map((item) => (
          <li className={styles.pill} data-reveal-item="true" key={item.label}>
            <span aria-hidden="true" className={styles.pillIcon}>
              <AudienceIcon iconKey={item.iconKey} />
            </span>
            <span className={styles.pillLabel}>{item.label}</span>
          </li>
        ))}
      </ul>

      {cta ? (
        <div className={styles.ctaWrap} data-reveal-item="true">
          {cta.helper ? <p className={styles.ctaHelper}>{cta.helper}</p> : null}
          <PrimaryCtaLink
            className={styles.cta}
            data-analytics-event="cta_click"
            data-analytics-location="audience"
            data-analytics-target={cta.analyticsTarget}
            data-analytics-variant={cta.analyticsVariant ?? "primary"}
            href={cta.href}
          >
            {cta.label}
          </PrimaryCtaLink>
        </div>
      ) : null}
    </section>
  );
}
