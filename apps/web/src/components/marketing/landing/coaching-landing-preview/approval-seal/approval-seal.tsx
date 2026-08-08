import Image from "next/image";

import styles from "./approval-seal.module.css";

type ApprovalSealProps = {
  ariaLabel: string;
  brand: string;
  stamped: boolean;
};

/** Stamps the demo once the pairs have been read. */
export function ApprovalSeal({ ariaLabel, brand, stamped }: ApprovalSealProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={styles.seal}
      data-stamped={stamped}
      role="img"
    >
      <span className={styles.ink} />
      <Image
        alt=""
        className={styles.mark}
        height={72}
        src="/brand/icon_noText.png"
        width={72}
      />
      <span className={styles.brand}>{brand}</span>
    </div>
  );
}
