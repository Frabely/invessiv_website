import styles from "./section-marker.module.css";

type SectionMarkerProps = {
  className?: string;
  index: string;
  label: string;
  total: string;
};

export function SectionMarker({
  className,
  index,
  label,
  total,
}: SectionMarkerProps) {
  const rootClass = className ? `${styles.marker} ${className}` : styles.marker;

  return (
    <p className={rootClass}>
      <span className={styles.index}>{index}</span>
      <span aria-hidden="true" className={styles.separator}>
        /
      </span>
      <span className={styles.total}>{total}</span>
      <span aria-hidden="true" className={styles.dash} />
      <span className={styles.label}>{label}</span>
    </p>
  );
}
