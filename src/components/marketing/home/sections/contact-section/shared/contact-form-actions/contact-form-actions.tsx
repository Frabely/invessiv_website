"use client";

import type { ReactNode } from "react";
import styles from "./contact-form-actions.module.css";

type ContactFormActionsProps = {
  buttons: ReactNode;
  layout?: "inline" | "stacked";
  requiredHint?: string;
};

export function ContactFormActions({
  buttons,
  layout = "inline",
  requiredHint,
}: ContactFormActionsProps) {
  if (layout === "stacked") {
    return (
      <div className={styles.actionsMain}>
        {requiredHint ? (
          <p className={styles.requiredHint}>{requiredHint}</p>
        ) : null}
        <div className={styles.actionsButtons}>{buttons}</div>
      </div>
    );
  }

  return (
    <div className={styles.stepActions}>
      {requiredHint ? (
        <p className={styles.requiredHint}>{requiredHint}</p>
      ) : null}
      <div className={styles.actionsButtons}>{buttons}</div>
    </div>
  );
}
