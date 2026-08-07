"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef } from "react";

import { LANDING_PREVIEW_ANCHOR_ORDER } from "@/common/constants/marketing";
import type { LandingPreviewAnchor } from "@/common/constants/marketing";
import type { LandingProblemSolutionContent } from "@/common/contracts/marketing";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import styles from "./problem-solution-section.module.css";

type ProblemSolutionSectionProps = LandingProblemSolutionContent & {
  activeAnchor: LandingPreviewAnchor | null;
  id: string;
  locale: Locale;
  onAnchorFocus: (anchor: LandingPreviewAnchor | null) => void;
  onAnchorHover: (anchor: LandingPreviewAnchor | null) => void;
  onAnchorToggle: (anchor: LandingPreviewAnchor) => void;
  selectedAnchor: LandingPreviewAnchor | null;
};

export function ProblemSolutionSection({
  activeAnchor,
  body,
  eyebrow,
  hint,
  id,
  locale,
  onAnchorFocus,
  onAnchorHover,
  onAnchorToggle,
  pairs,
  selectedAnchor,
  title,
}: ProblemSolutionSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  const handlePointerEnter = (
    event: ReactPointerEvent<HTMLButtonElement>,
    anchor: LandingPreviewAnchor,
  ) => {
    if (event.pointerType === "mouse") {
      onAnchorHover(anchor);
    }
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse") {
      onAnchorHover(null);
    }
  };

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.inner}>
        <header className={styles.header} data-reveal-item="true">
          <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.body}>{body}</p>
          <p className={styles.hint}>{hint}</p>
        </header>

        <ul className={styles.pairList}>
          {LANDING_PREVIEW_ANCHOR_ORDER.map((anchor) => {
            const pair = pairs[anchor];

            return (
              <li className={styles.pair} data-reveal-item="true" key={anchor}>
                <button
                  aria-pressed={anchor === selectedAnchor}
                  className={styles.pairButton}
                  data-active={anchor === activeAnchor}
                  onBlur={() => onAnchorFocus(null)}
                  onClick={() => onAnchorToggle(anchor)}
                  onFocus={() => onAnchorFocus(anchor)}
                  onPointerEnter={(event) => handlePointerEnter(event, anchor)}
                  onPointerLeave={handlePointerLeave}
                  type="button"
                >
                  <span className={styles.problem}>{pair.problem}</span>
                  <span aria-hidden="true" className={styles.arrow}>
                    →
                  </span>
                  <span className={styles.solution}>{pair.solution}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
