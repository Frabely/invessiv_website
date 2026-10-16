import type { ReactNode } from "react";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { ButtonControl, PrimaryCtaButton } from "@invessiv/ui";
import styles from "./onboarding-step-bar.module.css";

export type OnboardingStepBarProps = {
  backLabel: string;
  /** Names the next step; null on the last one, which has no way forward. */
  nextLabel: string | null;
  /** Null on the first step. */
  onBackAction: (() => void) | null;
  onNextAction: () => void;
  /** Shown at the start of the bar, such as the save state while the form is filled in. */
  status?: ReactNode;
};

/** The bar under a step of the onboarding form: back to the previous step, on to the next one. */
export function OnboardingStepBar({
  backLabel,
  nextLabel,
  onBackAction,
  onNextAction,
  status = null,
}: OnboardingStepBarProps) {
  return (
    <div className={styles.bar}>
      {status}
      <div className={styles.actions}>
        {onBackAction ? (
          <ButtonControl
            onClick={onBackAction}
            type="button"
            variant={ButtonVariant.Ghost}
          >
            {backLabel}
          </ButtonControl>
        ) : null}
        {nextLabel ? (
          <PrimaryCtaButton
            className={styles.next}
            onClick={onNextAction}
            type="button"
          >
            <span className={styles.nextLabel}>{nextLabel}</span>
          </PrimaryCtaButton>
        ) : null}
      </div>
    </div>
  );
}
