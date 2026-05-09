"use client";

import type { ReactNode } from "react";
import { FormActionsLayout } from "@/common/constants/form/form-actions-layout";
import styles from "./form-actions.module.css";

type FormActionsProps = {
  buttons: ReactNode;
  layout?: FormActionsLayout;
  requiredHint?: string;
};

export function FormActions({
  buttons,
  layout = FormActionsLayout.Inline,
  requiredHint,
}: FormActionsProps) {
  const rootClassName =
    layout === FormActionsLayout.Stacked
      ? styles.actionsMain
      : styles.stepActions;

  return (
    <div className={rootClassName}>
      {requiredHint ? (
        <p className={styles.requiredHint}>{requiredHint}</p>
      ) : null}
      <div className={styles.actionsButtons}>{buttons}</div>
    </div>
  );
}
