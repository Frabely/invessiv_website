import type { ComponentPropsWithoutRef } from "react";

import styles from "./workspace-scrollable-table-area.module.css";

type WorkspaceScrollableTableAreaProps = ComponentPropsWithoutRef<"section">;

export function WorkspaceScrollableTableArea({
  children,
  className,
  ...props
}: WorkspaceScrollableTableAreaProps) {
  return (
    <section
      {...props}
      className={className ? `${styles.area} ${className}` : styles.area}
    >
      {children}
    </section>
  );
}
