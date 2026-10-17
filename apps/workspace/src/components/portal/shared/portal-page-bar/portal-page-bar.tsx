import type { ReactNode } from "react";
import styles from "./portal-page-bar.module.css";

export type PortalPageBarProps = {
  /** The buttons at the end of the bar; on a phone they share a row of their own. */
  actions?: ReactNode;
  /** Shown at the start of the bar, such as the save state or how many entries there are. */
  status?: ReactNode;
};

/** The bar below the scroll area of a portal page with its main actions. */
export function PortalPageBar({
  actions = null,
  status = null,
}: PortalPageBarProps) {
  if (!status && !actions) return null;

  return (
    <div className={styles.bar}>
      {status}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
