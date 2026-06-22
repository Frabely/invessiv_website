import type { AnchorHTMLAttributes } from "react";
import styles from "./klarkompass-cta.module.css";

type KlarkompassCtaVariant = "primary" | "secondary";

type KlarkompassCtaProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  label: string;
  mockLabel?: string;
  variant?: KlarkompassCtaVariant;
};

export function KlarkompassCta({
  className,
  href,
  label,
  mockLabel,
  variant = "primary",
  ...props
}: KlarkompassCtaProps) {
  const classNames = [styles.cta, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <a className={classNames} href={href} {...props}>
      <span>{label}</span>
      {mockLabel ? <span className={styles.mockBadge}>{mockLabel}</span> : null}
    </a>
  );
}
