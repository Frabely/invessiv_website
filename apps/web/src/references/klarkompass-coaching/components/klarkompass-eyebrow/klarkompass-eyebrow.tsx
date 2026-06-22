import styles from "./klarkompass-eyebrow.module.css";

type KlarkompassEyebrowProps = {
  children: string;
  className?: string;
};

export function KlarkompassEyebrow({
  children,
  className,
}: KlarkompassEyebrowProps) {
  return (
    <p
      className={className ? `${styles.eyebrow} ${className}` : styles.eyebrow}
    >
      <span aria-hidden="true" className={styles.line} />
      {children}
    </p>
  );
}
