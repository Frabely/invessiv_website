import type { ReactNode } from "react";
import styles from "./selection-action-bar.module.css";

export type SelectionActionBarProps = {
  /** The buttons for the selection, such as clearing it or acting on every chosen entry. */
  actions: ReactNode;
  /** A quiet remark next to the count, such as a limit that was reached. */
  hint?: ReactNode;
  /** How many entries are chosen, as finished text. */
  summary: string;
};

/**
 * A pill floating at the bottom centre while entries of a list are chosen. A page with its own bar
 * at the bottom lifts it with `--selection-action-bar-offset`.
 */
export function SelectionActionBar({
  actions,
  hint,
  summary,
}: SelectionActionBarProps) {
  return (
    <div
      aria-label={summary}
      aria-live="polite"
      className={styles.bar}
      role="region"
    >
      <p className={styles.summary}>
        <strong>{summary}</strong>
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </p>
      <div className={styles.actions}>{actions}</div>
    </div>
  );
}
