import styles from "./approval-seal.module.css";

type ApprovalSealProps = {
  ariaLabel: string;
  brand: string;
  stamped: boolean;
};

/** Stamps the solved column once the last pair is reached. Mobile layout only. */
export function ApprovalSeal({ ariaLabel, brand, stamped }: ApprovalSealProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={styles.seal}
      data-stamped={stamped}
      role="img"
    >
      <span className={styles.ink} />
      <span className={styles.mark}>✓</span>
      <span className={styles.brand}>{brand}</span>
    </div>
  );
}
