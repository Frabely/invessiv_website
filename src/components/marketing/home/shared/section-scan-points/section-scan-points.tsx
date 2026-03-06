type SectionScanPointsProps = {
  fallbackClassName: string;
  fallbackText?: string;
  points?: string[];
};

export function SectionScanPoints({
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

  return (
    <ul className="section-scan-points">
      {normalizedPoints.map((point, index) => (
        <li className="section-scan-point" key={`${point}-${index}`}>
          {point}
        </li>
      ))}
    </ul>
  );
}
