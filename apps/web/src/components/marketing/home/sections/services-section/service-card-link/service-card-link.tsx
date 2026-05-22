import type { AnchorHTMLAttributes, ReactNode } from "react";

import styles from "./service-card-link.module.css";

type ServiceCardLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
};

export function ServiceCardLink({
  children,
  className,
  ...props
}: ServiceCardLinkProps) {
  const linkClassName = [styles.link, className].filter(Boolean).join(" ");

  return (
    <a className={linkClassName} {...props}>
      {children}
    </a>
  );
}
