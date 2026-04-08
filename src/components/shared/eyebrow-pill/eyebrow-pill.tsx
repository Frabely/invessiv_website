import styles from "./eyebrow-pill.module.css";

type EyebrowPillProps = {
  children: string;
  className?: string;
};

export function EyebrowPill({ children, className }: EyebrowPillProps) {
  return (
    <p className={className ? `${styles.root} ${className}` : styles.root}>
      <span aria-hidden="true" className={styles.dot} />
      <span>{children}</span>
    </p>
  );
}
