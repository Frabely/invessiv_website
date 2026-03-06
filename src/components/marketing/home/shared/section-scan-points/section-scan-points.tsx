type SectionScanPointsVariant = "default" | "hero";

type SectionScanPointsProps = {
  ariaLabel?: string;
  fallbackClassName: string;
  fallbackText?: string;
  points?: string[];
  variant?: SectionScanPointsVariant;
};

export function SectionScanPoints({
  ariaLabel,
  fallbackClassName,
  fallbackText,
  points,
  variant = "default",
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

  const pointsClassName =
    variant === "hero"
      ? "section-scan-points section-scan-points--hero"
      : "section-scan-points";
  const pointClassName =
    variant === "hero"
      ? "section-scan-point section-scan-point--hero"
      : "section-scan-point";

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
