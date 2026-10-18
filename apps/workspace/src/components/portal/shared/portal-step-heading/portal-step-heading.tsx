import { forwardRef, type ReactNode } from "react";
import styles from "./portal-step-heading.module.css";

export type PortalStepHeadingProps = {
  children: ReactNode;
  id?: string;
};

/**
 * The heading of one step of a portal page with steps. It takes the focus after a step change, so it
 * is focusable from script but no tab stop.
 */
export const PortalStepHeading = forwardRef<
  HTMLHeadingElement,
  PortalStepHeadingProps
>(function PortalStepHeading({ children, id }, ref) {
  return (
    <h2 className={styles.title} id={id} ref={ref} tabIndex={-1}>
      {children}
    </h2>
  );
});
