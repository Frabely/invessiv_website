import type { MouseEvent } from "react";

import { PrimaryCtaLink } from "@/components/shared/button/button";
import styles from "./site-header-cta.module.css";

type SiteHeaderCtaProps = {
  href: string;
  label: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  variant?: "desktop" | "menu" | "mobile";
};

const CTA_ANALYTICS_ATTRIBUTES = {
  "data-analytics-event": "cta_click",
  "data-analytics-location": "nav",
  "data-analytics-target": "form",
  "data-analytics-variant": "primary",
} as const;

export function SiteHeaderCta({
  href,
  label,
  onClick,
  variant = "desktop",
}: SiteHeaderCtaProps) {
  const className =
    variant === "desktop"
      ? styles.cta
      : variant === "mobile"
        ? `${styles.cta} ${styles.mobile}`
        : `${styles.cta} ${styles.menu}`;

  return (
    <PrimaryCtaLink
      {...CTA_ANALYTICS_ATTRIBUTES}
      aria-label={variant === "mobile" ? label : undefined}
      className={className}
      href={href}
      onClick={onClick}
    >
      {variant === "mobile" ? (
        <span aria-hidden="true" className={styles.icon}>
          <svg fill="none" viewBox="0 0 24 24">
            <path d="M7.5 19.5 3 21l1.5-4.5" />
            <path d="M7.5 19.5a9 9 0 1 0-3-6.72" />
            <circle
              cx="9.75"
              cy="12"
              fill="currentColor"
              r="0.9"
              stroke="none"
            />
            <circle
              cx="12.75"
              cy="12"
              fill="currentColor"
              r="0.9"
              stroke="none"
            />
            <circle
              cx="15.75"
              cy="12"
              fill="currentColor"
              r="0.9"
              stroke="none"
            />
          </svg>
        </span>
      ) : (
        label
      )}
    </PrimaryCtaLink>
  );
}
