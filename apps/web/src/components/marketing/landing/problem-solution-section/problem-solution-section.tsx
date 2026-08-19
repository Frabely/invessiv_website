"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef } from "react";

import type { LandingPreviewAnchor } from "@/common/constants/marketing";
import { LANDING_PREVIEW_ANCHOR_ORDER } from "@/common/constants/marketing";
import type { LandingProblemSolutionContent } from "@/common/contracts/marketing";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import styles from "./problem-solution-section.module.css";

type ProblemSolutionSectionProps = LandingProblemSolutionContent & {
  activeAnchor: LandingPreviewAnchor | null;
  id: string;
  locale: Locale;
  onAnchorAmbient: (anchor: LandingPreviewAnchor | null) => void;
  onAnchorFocus: (anchor: LandingPreviewAnchor | null) => void;
  onAnchorToggle: (anchor: LandingPreviewAnchor) => void;
  onMobilePreviewHostChange: (element: HTMLDivElement | null) => void;
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
  onMobilePreviewHostChange,
  pairs,
  selectedAnchor,
  title,
  usesTapToggle,
}: ProblemSolutionSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  const handlePointerEnter = (
    event: ReactPointerEvent<HTMLElement>,
    anchor: LandingPreviewAnchor,
  ) => {
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      onAnchorAmbient(anchor);
    }
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      onAnchorAmbient(null);
    }
  };

  const handleTap = (anchor: LandingPreviewAnchor) => {
    onAnchorToggle(anchor);
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

          <ul className={styles.pairList}>
            {LANDING_PREVIEW_ANCHOR_ORDER.map((anchor) => {
              const pair = pairs[anchor];
              const isSelected = anchor === selectedAnchor;
              const mobilePreviewId = `${id}-${anchor}-preview`;

              return (
                <li
                  className={styles.pair}
                  data-reveal-item="true"
                  data-selected={isSelected}
                  key={anchor}
                >
                  <button
                    aria-controls={usesTapToggle ? mobilePreviewId : undefined}
                    aria-expanded={usesTapToggle ? isSelected : undefined}
                    className={styles.pairButton}
                    data-active={anchor === activeAnchor}
                    onBlur={() => onAnchorFocus(null)}
                    onClick={() => {
                      if (usesTapToggle) {
                        handleTap(anchor);
                      }
                    }}
                    onFocus={() => {
                      if (!usesTapToggle) {
                        onAnchorFocus(anchor);
                      }
                    }}
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
                    <span aria-hidden="true" className={styles.actionCue}>
                      <FontAwesomeIcon icon={faChevronDown} />
                    </span>
                  </button>
                  <div
                    className={styles.mobilePreview}
                    data-testid={
                      isSelected ? "problem-solution-mobile-preview" : undefined
                    }
                    hidden={!usesTapToggle || !isSelected}
                    id={mobilePreviewId}
                    ref={
                      usesTapToggle && isSelected
                        ? onMobilePreviewHostChange
                        : undefined
                    }
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
