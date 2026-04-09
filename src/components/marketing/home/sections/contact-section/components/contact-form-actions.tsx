"use client";

import type { ReactNode } from "react";
import styles from "./contact-form-actions.module.css";

type ContactFormActionsProps = {
  buttons: ReactNode;
  layout?: "inline" | "stacked";
  panelHint?: string;
  requiredHint?: string;
};

export function ContactFormActions({
  buttons,
  layout = "inline",
  panelHint,
  requiredHint,
}: ContactFormActionsProps) {
  if (layout === "stacked") {
    return (
      <div className={styles.actions}>
        <div className={styles.actionsMain}>
          {panelHint ? <p className={styles.panelHint}>{panelHint}</p> : null}
          <div className={styles.actionsButtons}>{buttons}</div>
        </div>
        {requiredHint ? (
          <p className={styles.requiredHint}>{requiredHint}</p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className={styles.stepActions}>
        {panelHint ? <p className={styles.panelHint}>{panelHint}</p> : null}
        <div className={styles.actionsButtons}>{buttons}</div>
      </div>
      {requiredHint ? (
        <p className={styles.requiredHint}>{requiredHint}</p>
      ) : null}
    </>
  );
}
