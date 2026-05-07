"use client";

import type { ReactNode } from "react";
import styles from "./form-actions.module.css";

type FormActionsProps = {
  buttons: ReactNode;
  layout?: "inline" | "stacked";
  requiredHint?: string;
};

export function FormActions({
  buttons,
  layout = "inline",
  requiredHint,
}: FormActionsProps) {
  const rootClassName =
    layout === "stacked" ? styles.actionsMain : styles.stepActions;

  return (
    <div className={rootClassName}>
      {requiredHint ? (
        <p className={styles.requiredHint}>{requiredHint}</p>
      ) : null}
      <div className={styles.actionsButtons}>{buttons}</div>
    </div>
  );
}
