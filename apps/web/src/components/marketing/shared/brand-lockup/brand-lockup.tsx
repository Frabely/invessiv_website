import Image from "next/image";

import styles from "./brand-lockup.module.css";

const BRAND_LOGO_SRC = "/brand/invessiv-logo.svg";

type BrandLockupProps = {
  label: string;
  logoAlt: string;
  priority?: boolean;
};

/**
 * Invessiv logo plus wordmark. The logo scales with the inherited font size,
 * so the parent only sets typography.
 */
export function BrandLockup({ label, logoAlt, priority }: BrandLockupProps) {
  return (
    <span className={styles.lockup}>
      <Image
        alt={logoAlt}
        className={styles.logo}
        height={1341}
        priority={priority}
        src={BRAND_LOGO_SRC}
        width={1338}
      />
      <span className={styles.label}>{label}</span>
    </span>
  );
}
