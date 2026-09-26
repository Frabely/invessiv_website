"use client";

import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  /** Without the completion right there is no control at all, only the status. */
  readOnly: boolean;
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
  readOnly,
  statusLabel,
}: PortalTaskCheckboxProps) {
  if (readOnly) {
    return (
      <span className={styles.status} data-done={checked}>
        {checked ? (
          <FontAwesomeIcon aria-hidden="true" icon={faCircleCheck} />
        ) : (
          <span aria-hidden="true" className={styles.ring} />
        )}
        <span className="sr-only">{statusLabel}</span>
      </span>
    );
  }

  return (
    <label className={styles.hitArea} data-pending={pending || undefined}>
      <CheckboxControl
        aria-busy={pending || undefined}
        aria-describedby={describedById}
        aria-label={checked ? statusLabel : label}
        checked={checked}
        disabled={!enabled || checked || pending}
        onChange={(event) => {
          if (event.target.checked) onCompleteAction();
        }}
      />
    </label>
  );
}
