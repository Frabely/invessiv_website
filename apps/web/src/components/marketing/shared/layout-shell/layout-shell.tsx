import type { ReactNode } from "react";

import styles from "./layout-shell.module.css";

type LayoutShellProps = {
  children: ReactNode;
  className?: string;
};

export function LayoutShell({ children, className }: LayoutShellProps) {
  const marketingClassName = className
    ? `${styles.marketing} ${className}`
    : styles.marketing;

  return (
    <div className={styles.shell}>
      <div className={marketingClassName}>{children}</div>
    </div>
  );
}
