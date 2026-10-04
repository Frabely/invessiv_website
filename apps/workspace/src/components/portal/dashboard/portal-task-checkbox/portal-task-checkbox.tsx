"use client";

import { CheckboxControl } from "@invessiv/ui";
import styles from "./portal-task-checkbox.module.css";

export type PortalTaskCheckboxProps = {
  checked: boolean;
  /** Visible hint that explains a disabled checkbox, e.g. in the owner view. */
  describedById?: string;
  /**
   * False when this state cannot be changed here: the owner view, a missing grant, or a tick the
   * team set. The checkbox still shows the state.
   */
  enabled: boolean;
  /** Names the action the next click performs: completing or taking the tick back. */
  label: string;
  onToggleAction: (checked: boolean) => void;
  pending: boolean;
  /** Read out instead of `label` while the checkbox is locked. */
  statusLabel: string;
};

/** A 44px hit area around the visual box. */
export function PortalTaskCheckbox({
  checked,
  describedById,
  enabled,
  label,
  onToggleAction,
  pending,
  statusLabel,
}: PortalTaskCheckboxProps) {
  return (
    <label className={styles.hitArea} data-pending={pending || undefined}>
      <CheckboxControl
        aria-busy={pending || undefined}
        aria-describedby={describedById}
        aria-label={enabled ? label : statusLabel}
        checked={checked}
        disabled={!enabled || pending}
        onChange={(event) => onToggleAction(event.target.checked)}
      />
    </label>
  );
}
