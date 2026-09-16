import type { HTMLAttributes } from "react";
import styles from "./skeleton.module.css";

export type SkeletonProps = Omit<HTMLAttributes<HTMLSpanElement>, "children">;

/** A decorative placeholder for content that is still loading. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return <span {...props} aria-hidden="true" className={rootClassName} />;
}
