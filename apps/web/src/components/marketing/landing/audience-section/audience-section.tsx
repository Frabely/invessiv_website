"use client";

import { useId, useRef, useState } from "react";

import { PrimaryCtaLink } from "@/components/shared/button/button";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingAudienceContent } from "@/i18n/dictionaries/landing/audience";
import { AudienceDetailPanel } from "./audience-detail-panel/audience-detail-panel";
import { AudienceIcon } from "./audience-icon";
import styles from "./audience-section.module.css";

type AudienceSectionProps = LandingAudienceContent & {
  id: string;
  locale: Locale;
};

export function AudienceSection({
  body,
  cta,
  eyebrow,
  id,
  items,
  locale,
  outcomeLabel,
  title,
}: AudienceSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  useStaggeredSectionReveal(sectionRef, locale);

  const selectedItem = selectedIndex === null ? null : items[selectedIndex];

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <span aria-hidden="true" className={styles.spotlight} />

      <div className={styles.intro} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
      </div>

      <ul className={styles.pillList} data-reveal-item="true">
        {items.map((item, index) => {
          const isActive = index === selectedIndex;

          return (
            <li
              className={styles.pillItem}
              data-reveal-item="true"
              key={item.label}
            >
              <button
                aria-controls={panelId}
                aria-expanded={isActive}
                className={styles.pill}
                data-active={isActive ? "true" : undefined}
                data-analytics-event="audience_select"
                data-analytics-location="audience"
                data-analytics-target={item.iconKey}
                id={`${baseId}-pill-${index}`}
                onClick={() => {
                  setSelectedIndex(isActive ? null : index);
                }}
                type="button"
              >
                <span aria-hidden="true" className={styles.pillIcon}>
                  <AudienceIcon iconKey={item.iconKey} />
                </span>
                <span className={styles.pillLabel}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div
        aria-labelledby={
          selectedIndex === null ? undefined : `${baseId}-pill-${selectedIndex}`
        }
        aria-live="polite"
        className={styles.panelWrap}
        data-open={selectedItem ? "true" : undefined}
        id={panelId}
        role="region"
      >
        <div className={styles.panelInner}>
          {selectedItem ? (
            <AudienceDetailPanel
              detail={selectedItem.detail}
              iconKey={selectedItem.iconKey}
              label={selectedItem.label}
              outcomeLabel={outcomeLabel}
            />
          ) : null}
        </div>
      </div>

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
