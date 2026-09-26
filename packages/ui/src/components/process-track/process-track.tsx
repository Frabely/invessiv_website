"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./process-track.module.css";

export type ProcessTrackProps = {
  steps: readonly string[];
  currentIndex: number;
  label: string;
  summary?: ReactNode;
  onStepAction?: (step: string, index: number) => void;
  scrollCurrentIntoView?: boolean;
};

export function ProcessTrack({
  steps,
  currentIndex,
  label,
  summary,
  onStepAction,
  scrollCurrentIntoView = true,
}: ProcessTrackProps) {
  const currentStepRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!scrollCurrentIntoView) return;
    currentStepRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentIndex, scrollCurrentIntoView, steps]);

  return (
    <div className={styles.progress}>
      {summary}
      <ol aria-label={label} className={styles.track}>
        {steps.map((step, index) => {
          const state =
            index < currentIndex
              ? "complete"
              : index === currentIndex
                ? "current"
                : "upcoming";
          const body = (
            <>
              <span aria-hidden="true" className={styles.segment} />
              <span className={styles.label}>
                {state === "complete" ? (
                  <FontAwesomeIcon
                    aria-hidden="true"
                    className={styles.check}
                    icon={faCheck}
                  />
                ) : null}
                {step}
              </span>
            </>
          );
          return (
            <li
              aria-current={state === "current" ? "step" : undefined}
              className={styles.step}
              data-state={state}
              key={`${step}-${index}`}
              ref={state === "current" ? currentStepRef : undefined}
            >
              {onStepAction ? (
                <button
                  className={styles.stepButton}
                  onClick={() => onStepAction(step, index)}
                  type="button"
                >
                  {body}
                </button>
              ) : (
                <span className={styles.stepBody}>{body}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
