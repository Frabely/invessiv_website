"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProcessStepState } from "@invessiv/common/constants/ui/process-step-states";
import { ButtonControl } from "../button/button";
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
              ? ProcessStepState.Complete
              : index === currentIndex
                ? ProcessStepState.Current
                : ProcessStepState.Upcoming;
          const body = (
            <>
              <span aria-hidden="true" className={styles.segment} />
              <span className={styles.label}>
                {state === ProcessStepState.Complete ? (
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
              aria-current={
                state === ProcessStepState.Current ? "step" : undefined
              }
              className={styles.step}
              data-state={state}
              key={`${step}-${index}`}
              ref={
                state === ProcessStepState.Current ? currentStepRef : undefined
              }
            >
              {onStepAction ? (
                <ButtonControl
                  className={styles.stepButton}
                  onClick={() => onStepAction(step, index)}
                  type="button"
                  variant="ghost"
                >
                  {body}
                </ButtonControl>
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
