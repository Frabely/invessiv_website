"use client";

import { CheckboxControl } from "@invessiv/ui";
import styles from "./portal-task-checkbox.module.css";

export type PortalTaskCheckboxProps = {
  checked: boolean;
  /** Visible hint that explains a disabled checkbox, e.g. in the owner view. */
  describedById?: string;
  /** False in the owner view: the checkbox shows but cannot write. */
  enabled: boolean;
  label: string;
  onCompleteAction: () => void;
  pending: boolean;
  statusLabel: string;
};

/**
 * A 44px hit area around the visual box. A completed task stays checked and locked: reopening is
 * the team's decision in the CRM, not a portal action.
 */
export function PortalTaskCheckbox({
  checked,
  describedById,
  enabled,
  label,
  onCompleteAction,
  pending,
  statusLabel,
}: PortalTaskCheckboxProps) {
  return (
    <label className={styles.hitArea} data-pending={pending || undefined}>
      <CheckboxControl
        aria-busy={pending || undefined}
        aria-describedby={describedById}
        aria-label={checked || !enabled ? statusLabel : label}
        checked={checked}
        disabled={!enabled || checked || pending}
        onChange={(event) => {
          if (event.target.checked) onCompleteAction();
        }}
      />
    </label>
  );
}
