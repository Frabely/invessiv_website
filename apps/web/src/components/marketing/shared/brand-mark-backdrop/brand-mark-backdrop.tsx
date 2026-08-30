import Image from "next/image";

import styles from "./brand-mark-backdrop.module.css";

const BRAND_MARK_SRC = "/brand/icon_noText.png";

type BrandMarkBackdropProps = {
  sizes: string;
};

/**
 * Decorative Invessiv mark. The parent owns placement and stacking through a
 * positioned slot; this component only carries the watermark treatment.
 */
export function BrandMarkBackdrop({ sizes }: BrandMarkBackdropProps) {
  return (
    <span aria-hidden="true" className={styles.mark}>
      <Image
        alt=""
        className={styles.image}
        fill
        sizes={sizes}
        src={BRAND_MARK_SRC}
      />
    </span>
  );
}
