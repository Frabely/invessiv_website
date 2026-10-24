import styles from "./brand-lockup.module.css";

const BRAND_LOGO_SRC = "/brand/invessiv-logo.svg";

export type BrandLockupProps = {
  collapseLabelOnMobile?: boolean;
  label: string;
  logoAlt: string;
  priority?: boolean;
};

/**
 * Invessiv logo plus wordmark. The logo scales with the inherited font size,
 * so the parent only sets typography. Every app serves the logo under the
 * same public path.
 */
export function BrandLockup({
  collapseLabelOnMobile,
  label,
  logoAlt,
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
        height={1341}
        src={BRAND_LOGO_SRC}
        width={1338}
      />
      <span className={styles.label}>{label}</span>
    </span>
  );
}
