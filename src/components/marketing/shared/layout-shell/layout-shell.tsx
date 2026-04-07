import type { ReactNode } from "react";

import styles from "./layout-shell.module.css";

type LayoutShellProps = {
  children: ReactNode;
  className?: string;
};

export function LayoutShell({ children, className }: LayoutShellProps) {
  const shellClassName = className
    ? `${styles.shell} ${styles.marketing} ${className}`
    : `${styles.shell} ${styles.marketing}`;

  return <div className={shellClassName}>{children}</div>;
}
