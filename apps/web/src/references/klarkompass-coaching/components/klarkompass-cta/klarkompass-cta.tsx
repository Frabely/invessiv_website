"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import styles from "./klarkompass-cta.module.css";

type KlarkompassCtaVariant = "primary" | "secondary";

type KlarkompassCtaProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  label: string;
  mockAlertMessage?: string;
  variant?: KlarkompassCtaVariant;
};

export function KlarkompassCta({
  className,
  href,
  label,
  mockAlertMessage,
  onClick,
  variant = "primary",
  ...props
}: KlarkompassCtaProps) {
  const classNames = [styles.cta, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (mockAlertMessage) {
      event.preventDefault();
      window.alert(mockAlertMessage);
    }

    onClick?.(event);
  };

  return (
    <a className={classNames} href={href} onClick={handleClick} {...props}>
      <span>{label}</span>
    </a>
  );
}
