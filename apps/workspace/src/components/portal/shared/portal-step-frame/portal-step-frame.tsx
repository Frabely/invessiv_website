import { forwardRef, type ReactNode } from "react";
import styles from "./portal-step-frame.module.css";

export type PortalStepFrameProps = {
  /** The bar below the step, resting outside the scroll area. */
  bar: ReactNode;
  /** The open step, scrolling between header and bar. */
  children: ReactNode;
  /** The header of the page with its step track. */
  header: ReactNode;
};

/**
 * A portal page with steps, such as the onboarding form or the feedback rounds: the header on top, the step scrolling in
 * between, the bar below. The ref is the scroll area, so a new step can start at its top.
 */
export const PortalStepFrame = forwardRef<HTMLDivElement, PortalStepFrameProps>(
  function PortalStepFrame({ bar, children, header }, ref) {
    return (
      <div className={styles.frame}>
        {header}
        <div className={styles.body} ref={ref}>
          {children}
        </div>
        {bar}
      </div>
    );
  },
);
