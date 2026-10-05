import type { ReactNode } from "react";
import type { OnboardingFieldSpan } from "@/common/constants/portal/onboarding-field-spans";
import styles from "./onboarding-field-grid.module.css";

export type OnboardingFieldGridProps = { children: ReactNode };

export type OnboardingFieldCellProps = {
  children: ReactNode;
  span: OnboardingFieldSpan;
};

/**
 * Lays questions out in as many columns as the grid's own width carries, so the same grid works
 * in a wide step and inside a narrower group entry. The order in the DOM stays the order of the
 * questions; columns only fill rows.
 */
export function OnboardingFieldGrid({ children }: OnboardingFieldGridProps) {
  return (
    <div className={styles.frame}>
      <div className={styles.grid}>{children}</div>
    </div>
  );
}

/** One question in the grid; `span` comes from `onboardingFieldSpan`. */
export function OnboardingFieldCell({
  children,
  span,
}: OnboardingFieldCellProps) {
  return (
    <div className={styles.cell} data-span={span}>
      {children}
    </div>
  );
}
