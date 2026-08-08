"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useRef } from "react";

import type { LandingPreviewAnchor } from "@/common/constants/marketing";
import { LANDING_PREVIEW_ANCHOR_ORDER } from "@/common/constants/marketing";
import type { LandingProblemSolutionContent } from "@/common/contracts/marketing";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useScrollFocusedItem } from "@/hooks/marketing/use-scroll-focused-item";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import styles from "./problem-solution-section.module.css";

type ProblemSolutionSectionProps = LandingProblemSolutionContent & {
  activeAnchor: LandingPreviewAnchor | null;
  id: string;
  locale: Locale;
  onAnchorAmbient: (anchor: LandingPreviewAnchor | null) => void;
  onAnchorFocus: (anchor: LandingPreviewAnchor | null) => void;
  onAnchorToggle: (anchor: LandingPreviewAnchor) => void;
  onPairsRead: () => void;
  selectedAnchor: LandingPreviewAnchor | null;
  usesTapToggle: boolean;
};

export function ProblemSolutionSection({
  activeAnchor,
  body,
  eyebrow,
  id,
  labels,
  locale,
  onAnchorAmbient,
  onAnchorFocus,
  onAnchorToggle,
  onPairsRead,
  pairs,
  selectedAnchor,
  title,
  usesTapToggle,
}: ProblemSolutionSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  const reportScrollFocus = useCallback(
    (index: number | null) => {
      if (usesTapToggle) {
        onAnchorAmbient(
          index === null ? null : (LANDING_PREVIEW_ANCHOR_ORDER[index] ?? null),
        );
      }

      if (index === LANDING_PREVIEW_ANCHOR_ORDER.length - 1) {
        onPairsRead();
      }
    },
    [onAnchorAmbient, onPairsRead, usesTapToggle],
  );

  useScrollFocusedItem(listRef, {
    enabled: true,
    itemSelector: ":scope > li",
    onFocusChange: reportScrollFocus,
  });

  const handlePointerEnter = (
    event: ReactPointerEvent<HTMLButtonElement>,
    anchor: LandingPreviewAnchor,
  ) => {
    if (event.pointerType === "mouse") {
      onAnchorAmbient(anchor);
    }
  };

  /** Also releases the focus a mouse click leaves behind, so nothing sticks. */
  const handlePointerLeave = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse") {
      onAnchorAmbient(null);
      onAnchorFocus(null);
    }
  };

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.inner}>
        <header className={styles.header} data-reveal-item="true">
          <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.body}>{body}</p>
        </header>

        <div className={styles.ledger}>
          <div className={styles.columns} data-reveal-item="true">
            <span className={styles.columnLabel}>{labels.problem}</span>
            <span className={styles.columnLabel}>{labels.solution}</span>
          </div>

          <ul className={styles.pairList} ref={listRef}>
            {LANDING_PREVIEW_ANCHOR_ORDER.map((anchor) => {
              const pair = pairs[anchor];

              return (
                <li
                  className={styles.pair}
                  data-reveal-item="true"
                  key={anchor}
                >
                  <button
                    aria-pressed={
                      usesTapToggle ? anchor === selectedAnchor : undefined
                    }
                    className={styles.pairButton}
                    data-active={anchor === activeAnchor}
                    onBlur={() => onAnchorFocus(null)}
                    onClick={
                      usesTapToggle ? () => onAnchorToggle(anchor) : undefined
                    }
                    onFocus={
                      usesTapToggle ? undefined : () => onAnchorFocus(anchor)
                    }
                    onPointerEnter={(event) =>
                      handlePointerEnter(event, anchor)
                    }
                    onPointerLeave={handlePointerLeave}
                    type="button"
                  >
                    <span className={styles.problem}>{pair.problem}</span>
                    <span aria-hidden="true" className={styles.link}>
                      <span className={styles.node} />
                    </span>
                    <span className={styles.solution}>{pair.solution}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
