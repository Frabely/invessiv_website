import { forwardRef, type ReactNode } from "react";
import styles from "./onboarding-step-frame.module.css";

export type OnboardingStepFrameProps = {
  /** The bar below the step, resting outside the scroll area. */
  bar: ReactNode;
  /** The open step, scrolling between header and bar. */
  children: ReactNode;
  /** The header of the form with its step track. */
  header: ReactNode;
};

/**
 * The page of the onboarding form, filled in or read: the header on top, the step scrolling in
 * between, the bar below. The ref is the scroll area, so a new step can start at its top.
 */
export const OnboardingStepFrame = forwardRef<
  HTMLDivElement,
  OnboardingStepFrameProps
>(function OnboardingStepFrame({ bar, children, header }, ref) {
  return (
    <div className={styles.frame}>
      {header}
      <div className={styles.body} ref={ref}>
        {children}
      </div>
      {bar}
    </div>
  );
});
