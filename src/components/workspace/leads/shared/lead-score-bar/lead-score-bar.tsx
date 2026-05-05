import type { CSSProperties } from "react";
import styles from "./lead-score-bar.module.css";

type LeadScoreBarProps = {
  ariaLabel: string;
  className?: string;
  score: number | null;
};

const SEGMENT_COUNT = 20;

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function getScoreAccent(score: number | null) {
  if (score == null) {
    return undefined;
  }

  const normalized = clampScore(score) / 100;
  const hue = normalized * 135;

  return `hsl(${hue.toFixed(1)} 68% 52%)`;
}

function getFilledSegments(score: number | null) {
  if (score == null) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(SEGMENT_COUNT, Math.round(clampScore(score) / 5)),
  );
}

export function LeadScoreBar({
  ariaLabel,
  className,
  score,
}: LeadScoreBarProps) {
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  const displayValue = score == null ? "—" : score;
  const filledSegments = getFilledSegments(score);

  const style = {
    "--score-accent": getScoreAccent(score),
  } as CSSProperties;

  return (
    <div
      aria-label={`${ariaLabel}: ${displayValue}`}
      className={rootClassName}
      data-empty={score == null ? "true" : "false"}
      style={style}
    >
      <div aria-hidden="true" className={styles.track}>
        {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
          <span
            className={styles.segment}
            data-filled={index < filledSegments ? "true" : "false"}
            key={index}
          />
        ))}
      </div>
      <span className={styles.value}>{displayValue}</span>
    </div>
  );
}
