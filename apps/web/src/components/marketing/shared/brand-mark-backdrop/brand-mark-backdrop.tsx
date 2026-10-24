import Image from "next/image";
import { BRAND_ASSETS } from "@/common/constants/brand/brand-assets";

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
        src={BRAND_ASSETS.logo.src}
      />
    </span>
  );
}
