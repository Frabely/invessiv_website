import styles from "./data-table-loading-overlay.module.css";

export type DataTableLoadingOverlayProps = {
  ariaLabel: string;
};

export function DataTableLoadingOverlay({
  ariaLabel,
}: DataTableLoadingOverlayProps) {
  return (
    <div
      aria-label={ariaLabel}
      aria-live="polite"
      className={styles.overlay}
      role="status"
    >
      <span aria-hidden="true" className={styles.spinner} />
      <span className={styles.srOnly}>{ariaLabel}</span>
    </div>
  );
}
