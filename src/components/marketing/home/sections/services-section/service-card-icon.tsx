import type { CSSProperties } from "react";

import styles from "./service-card-icon.module.css";

type ServiceCardIconProps = {
  iconAlt?: string;
  iconSrc?: string;
};

function FallbackIcon() {
  return (
    <svg aria-hidden="true" className={styles.iconImage} viewBox="0 0 24 24">
      <circle cx="12" cy="12" fill="currentColor" opacity="0.3" r="9" />
      <circle cx="12" cy="12" fill="currentColor" r="3" />
    </svg>
  );
}

export function ServiceCardIcon({ iconAlt, iconSrc }: ServiceCardIconProps) {
  const ariaLabel = iconAlt ?? "Service icon";
  const iconMaskStyle = iconSrc
    ? ({ "--service-icon-mask": `url("${iconSrc}")` } as CSSProperties)
    : undefined;

  return (
    <span aria-label={ariaLabel} className={styles.icon} role="img">
      {iconSrc ? (
        <span
          aria-hidden="true"
          className={`${styles.iconImage} ${styles.iconImageMask}`}
          style={iconMaskStyle}
        />
      ) : (
        <FallbackIcon />
      )}
    </span>
  );
}
