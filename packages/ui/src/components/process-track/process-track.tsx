"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProcessStepProgress } from "@invessiv/common/constants/ui/process-step-progress";
import { ProcessStepState } from "@invessiv/common/constants/ui/process-step-states";
import { ProcessStepVariant } from "@invessiv/common/constants/ui/process-step-variants";
import type { ProcessTrackStep } from "@invessiv/common/contracts/ui/process-track-step";
import { ButtonControl } from "../button/button";
import styles from "./process-track.module.css";

export type ProcessTrackProps = {
  /** Plain labels, or step objects when steps need a stable key or an accent. */
  steps: readonly (string | ProcessTrackStep)[];
  currentIndex: number;
  label: string;
  summary?: ReactNode;
  onStepAction?: (step: string, index: number) => void;
  scrollCurrentIntoView?: boolean;
};

function toStep(step: string | ProcessTrackStep, index: number) {
  return typeof step === "string"
    ? {
        key: `${step}-${index}`,
        label: step,
        variant: ProcessStepVariant.Default,
        progress: undefined,
      }
    : {
        key: step.key,
        label: step.label,
        variant: step.variant ?? ProcessStepVariant.Default,
        progress: step.progress,
      };
}

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
        {steps.map((rawStep, index) => {
          const step = toStep(rawStep, index);
          const state =
            index < currentIndex
              ? ProcessStepState.Complete
              : index === currentIndex
                ? ProcessStepState.Current
                : ProcessStepState.Upcoming;
          // A step with its own progress is ticked off when it is done, not when it was passed.
          const done = step.progress
            ? step.progress === ProcessStepProgress.Complete
            : state === ProcessStepState.Complete;
          const body = (
            <>
              <span aria-hidden="true" className={styles.segment} />
              <span className={styles.label}>
                {done ? (
                  <FontAwesomeIcon
                    aria-hidden="true"
                    className={styles.check}
                    icon={faCheck}
                  />
                ) : null}
                {step.label}
              </span>
            </>
          );
          return (
            <li
              aria-current={
                state === ProcessStepState.Current ? "step" : undefined
              }
              className={styles.step}
              data-progress={step.progress}
              data-state={state}
              data-variant={step.variant}
              key={step.key}
              ref={
                state === ProcessStepState.Current ? currentStepRef : undefined
              }
            >
              {onStepAction ? (
                <ButtonControl
                  className={styles.stepButton}
                  onClick={() => onStepAction(step.label, index)}
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
