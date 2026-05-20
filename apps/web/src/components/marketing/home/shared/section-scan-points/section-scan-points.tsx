import styles from "./section-scan-points.module.css";

type SectionScanPointsProps = {
  ariaLabel?: string;
  className?: string;
  fallbackClassName?: string;
  fallbackText?: string;
  points?: string[];
};

export function SectionScanPoints({
  ariaLabel,
  className,
  fallbackClassName,
  fallbackText,
  points,
}: SectionScanPointsProps) {
  const normalizedPoints =
    points?.map((point) => point.trim()).filter((point) => point.length > 0) ??
    [];

  if (!normalizedPoints.length) {
    if (!fallbackText) {
      return null;
    }

    return <p className={fallbackClassName}>{fallbackText}</p>;
  }

  const pointsClassName = className
    ? `${styles.list} ${className}`
    : styles.list;
  const pointClassName = styles.item;

  return (
    <ul aria-label={ariaLabel} className={pointsClassName}>
      {normalizedPoints.map((point, index) => (
        <li className={pointClassName} key={`${point}-${index}`}>
          {point}
        </li>
      ))}
    </ul>
  );
}
