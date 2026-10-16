import { forwardRef, type ReactNode } from "react";
import styles from "./onboarding-step-heading.module.css";

export type OnboardingStepHeadingProps = {
  children: ReactNode;
  id?: string;
};

/**
 * The heading of one step of the onboarding form. It takes the focus after a step change, so it
 * is focusable from script but no tab stop.
 */
export const OnboardingStepHeading = forwardRef<
  HTMLHeadingElement,
  OnboardingStepHeadingProps
>(function OnboardingStepHeading({ children, id }, ref) {
  return (
    <h2 className={styles.title} id={id} ref={ref} tabIndex={-1}>
      {children}
    </h2>
  );
});
