import styles from "./brand-lockup.module.css";

const BRAND_LOGO_SRC = "/brand/invessiv-logo.svg";

export type BrandLockupProps = {
  collapseLabelOnMobile?: boolean;
  label: string;
  logoAlt: string;
  logoSrc?: string;
  logoWidth?: number;
  logoHeight?: number;
  priority?: boolean;
};

/**
 * Invessiv logo plus wordmark. The logo scales with the inherited font size,
 * so the parent only sets typography. Applications can provide their own asset
 * while retaining the shared default path.
 */
export function BrandLockup({
  collapseLabelOnMobile,
  label,
  logoAlt,
  logoSrc = BRAND_LOGO_SRC,
  logoWidth = 1338,
  logoHeight = 1341,
  priority,
}: BrandLockupProps) {
  return (
    <span
      className={styles.lockup}
      data-collapse-label={collapseLabelOnMobile ? "true" : undefined}
    >
      {/* An SVG gains nothing from next/image, and the package stays framework-free. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={logoAlt}
        className={styles.logo}
        fetchPriority={priority ? "high" : undefined}
        height={logoHeight}
        src={logoSrc}
        width={logoWidth}
      />
      <span className={styles.label}>{label}</span>
    </span>
  );
}
