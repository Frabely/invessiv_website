import Image from "next/image";

import styles from "./approval-seal.module.css";

type ApprovalSealProps = {
  brand: string;
  stamped: boolean;
};

export function ApprovalSeal({ brand, stamped }: ApprovalSealProps) {
  return (
    <div
      aria-hidden="true"
      className={styles.seal}
      data-stamped={stamped}
      data-testid="coaching-preview-approval-seal"
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
