"use client";

import { useCallback, useRef, useState } from "react";

import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useMediaQuery } from "@/hooks/marketing/use-media-query";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingAudienceContent } from "@/i18n/dictionaries/landing/audience";
import { AudienceDetailPanel } from "./audience-detail-panel/audience-detail-panel";
import { AudienceIcon } from "./audience-icon";
import { AudienceSheet } from "./audience-sheet/audience-sheet";
import styles from "./audience-section.module.css";

/** Mirrors the `max-width: 640px` block in audience-section.module.css. */
const SHEET_MEDIA_QUERY = "(max-width: 640px)";

function renderHighlightedBody(body: string, highlight: string) {
  const start = body.indexOf(highlight);

  if (start < 0) {
    return body;
  }

  return (
    <>
      {body.slice(0, start)}
      <span className={styles.bodyHighlight}>{highlight}</span>
      {body.slice(start + highlight.length)}
    </>
  );
}

type AudienceSectionProps = LandingAudienceContent & {
  id: string;
  locale: Locale;
};

export function AudienceSection({
  body,
  bodyHighlight,
  closeLabel,
  cta,
  eyebrow,
  id,
  items,
  locale,
  outcomeLabel,
  title,
}: AudienceSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const activePillRef = useRef<HTMLButtonElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const usesSheet = useMediaQuery(SHEET_MEDIA_QUERY);
  const panelId = `${id}-panel`;
  const headlineId = `${id}-sheet-headline`;
  useStaggeredSectionReveal(sectionRef, locale);

  const selectedItem = selectedIndex === null ? null : items[selectedIndex];

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
  }, []);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <span aria-hidden="true" className={styles.spotlight} />

      <div className={styles.intro} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>
          {renderHighlightedBody(body, bodyHighlight)}
        </p>
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
                aria-expanded={isActive && !usesSheet}
                className={styles.pill}
                data-active={isActive ? "true" : undefined}
                data-analytics-event="audience_select"
                data-analytics-location="audience"
                data-analytics-target={item.iconKey}
                id={`${id}-pill-${index}`}
                onClick={(event) => {
                  if (usesSheet) {
                    activePillRef.current = event.currentTarget;
                    setSelectedIndex(index);
                    setSheetOpen(true);
                    return;
                  }
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
          selectedIndex === null ? undefined : `${id}-pill-${selectedIndex}`
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
              cta={cta}
              detail={selectedItem.detail}
              iconKey={selectedItem.iconKey}
              label={selectedItem.label}
              outcomeLabel={outcomeLabel}
            />
          ) : null}
        </div>
      </div>

      {usesSheet && selectedItem ? (
        <AudienceSheet
          closeLabel={closeLabel}
          labelledById={headlineId}
          onClose={closeSheet}
          open={sheetOpen}
          returnFocusRef={activePillRef}
        >
          <AudienceDetailPanel
            cta={cta}
            detail={selectedItem.detail}
            headlineId={headlineId}
            iconKey={selectedItem.iconKey}
            label={selectedItem.label}
            outcomeLabel={outcomeLabel}
          />
        </AudienceSheet>
      ) : null}
    </section>
  );
}
