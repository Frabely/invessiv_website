import styles from "./eyebrow-pill.module.css";

type EyebrowPillVariant = "default" | "subtle";

type EyebrowPillProps = {
  children: string;
  className?: string;
  variant?: EyebrowPillVariant;
};

export function EyebrowPill({
  children,
  className,
  variant = "default",
}: EyebrowPillProps) {
  return (
    <p
      className={[styles.root, styles[variant], className]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden="true" className={styles.arc} />
      <span>{children}</span>
    </p>
  );
}
