import type { ReactNode } from "react";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { ButtonControl, PrimaryCtaButton } from "@invessiv/ui";
import { PortalPageBar } from "../portal-page-bar/portal-page-bar";
import styles from "./portal-step-bar.module.css";

export type PortalStepBarProps = {
  /** The main action of the open step, e.g. submitting; takes the place of the way forward. */
  action?: ReactNode;
  backLabel: string;
  /** Names the next step; null on the last one, which has no way forward. */
  nextLabel: string | null;
  /** Null on the first step. */
  onBackAction: (() => void) | null;
  onNextAction: () => void;
  /** Shown at the start of the bar, such as the save state while a form is filled in. */
  status?: ReactNode;
};

/** The bar under a step of a portal page with steps: back to the previous step, on to the next one. */
export function PortalStepBar({
  action = null,
  backLabel,
  nextLabel,
  onBackAction,
  onNextAction,
  status = null,
}: PortalStepBarProps) {
  const forward =
    action ??
    (nextLabel ? (
      <PrimaryCtaButton
        className={styles.next}
        onClick={onNextAction}
        type="button"
      >
        <span className={styles.nextLabel}>{nextLabel}</span>
      </PrimaryCtaButton>
    ) : null);

  return (
    <PortalPageBar
      actions={
        onBackAction || forward ? (
          <>
            {onBackAction ? (
              <ButtonControl
                onClick={onBackAction}
                type="button"
                variant={ButtonVariant.Ghost}
              >
                {backLabel}
              </ButtonControl>
            ) : null}
            {forward}
          </>
        ) : null
      }
      status={status}
    />
  );
}
