"use client";

import { type ReactNode, useEffect, useRef } from "react";
import {
  faCheck,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProcessStepProgress } from "@invessiv/common/constants/ui/process-step-progress";
import { ProcessStepState } from "@invessiv/common/constants/ui/process-step-states";
import { ProcessStepTone } from "@invessiv/common/constants/ui/process-step-tones";
import { ProcessStepVariant } from "@invessiv/common/constants/ui/process-step-variants";
import { ProcessTrackDensity } from "@invessiv/common/constants/ui/process-track-densities";
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
  /** `compact` for a track that sits inside another frame, e.g. a sticky page header. */
  density?: ProcessTrackDensity;
};

function toStep(
  step: string | ProcessTrackStep,
  index: number,
): ProcessTrackStep {
  return typeof step === "string"
    ? { key: `${step}-${index}`, label: step }
    : step;
}

export function ProcessTrack({
  steps,
  currentIndex,
  label,
  summary,
  onStepAction,
  scrollCurrentIntoView = true,
  density = ProcessTrackDensity.Default,
}: ProcessTrackProps) {
  const trackRef = useRef<HTMLOListElement>(null);
  const currentStepRef = useRef<HTMLLIElement>(null);

  // Scrolls the track itself, never the page: `scrollIntoView` would also pull the page up to the
  // track on every re-render of a form that sits far below it. Only a new current step moves it.
  useEffect(() => {
    const track = trackRef.current;
    const step = currentStepRef.current;
    if (!scrollCurrentIntoView || !track || !step) return;
    const trackBox = track.getBoundingClientRect();
    const stepBox = step.getBoundingClientRect();
    // Smooth scrolling is the track's CSS, so reduced motion is respected in one place.
    track.scrollLeft =
      track.scrollLeft +
      stepBox.left -
      trackBox.left -
      (trackBox.width - stepBox.width) / 2;
  }, [currentIndex, scrollCurrentIntoView]);

  return (
    <div className={styles.progress} data-density={density}>
      {summary}
      <ol aria-label={label} className={styles.track} ref={trackRef}>
        {steps.map((rawStep, index) => {
          const step = toStep(rawStep, index);
          const state =
            index < currentIndex
              ? ProcessStepState.Complete
              : index === currentIndex
                ? ProcessStepState.Current
                : ProcessStepState.Upcoming;
          const measured = step.ratio !== undefined;
          const tone = measured
            ? (step.tone ?? ProcessStepTone.Neutral)
            : undefined;
          const alert = tone === ProcessStepTone.Danger;
          // A step with its own state is ticked off when it says so, not when it was passed.
          const done = measured
            ? step.valid === true && !alert
            : step.progress
              ? step.progress === ProcessStepProgress.Complete
              : state === ProcessStepState.Complete;
          const body = (
            <>
              <span aria-hidden="true" className={styles.segment}>
                {measured ? (
                  <svg
                    className={styles.fill}
                    preserveAspectRatio="none"
                    viewBox="0 0 100 1"
                  >
                    <rect
                      height="1"
                      width={Math.min(1, Math.max(0, step.ratio ?? 0)) * 100}
                    />
                  </svg>
                ) : null}
              </span>
              <span className={styles.label}>
                {alert ? (
                  <FontAwesomeIcon
                    aria-hidden="true"
                    className={styles.alert}
                    icon={faCircleExclamation}
                  />
                ) : done ? (
                  <FontAwesomeIcon
                    aria-hidden="true"
                    className={styles.check}
                    icon={faCheck}
                  />
                ) : null}
                <span className={styles.text} title={step.label}>
                  {step.label}
                </span>
                {step.detail ? (
                  <span aria-hidden="true" className={styles.detail}>
                    {step.detail}
                  </span>
                ) : null}
                {step.statusLabel ? (
                  <span className={styles.srOnly}>, {step.statusLabel}</span>
                ) : null}
              </span>
            </>
          );
          return (
            <li
              aria-current={
                state === ProcessStepState.Current ? "step" : undefined
              }
              className={styles.step}
              data-progress={measured ? undefined : step.progress}
              data-state={state}
              data-tone={tone}
              data-variant={step.variant ?? ProcessStepVariant.Default}
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
