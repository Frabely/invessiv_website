import Image from "next/image";
import { BrandLogo } from "@invessiv/common/constants/brand/brand-logo";

import styles from "./brand-mark-backdrop.module.css";

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
        src={BrandLogo.src}
      />
    </span>
  );
}
