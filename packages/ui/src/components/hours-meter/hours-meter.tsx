import type { HoursMeterSegment } from "@invessiv/common/contracts/time/hours-meter-segment";
import styles from "./hours-meter.module.css";

export type HoursMeterProps = {
  /** Thin bar for a list row instead of the one under the figures. */
  compact?: boolean;
  /** Drawn left to right; each takes its share of all segments. */
  segments: readonly HoursMeterSegment[];
};

/**
 * The split of the hours as a stacked bar, hidden from assistive technology: every statement next
 * to it is text. Widths are SVG attributes, never inline styles.
 */
export function HoursMeter({ compact = false, segments }: HoursMeterProps) {
  const total = segments.reduce(
    (sum, segment) => sum + Math.max(segment.minutes, 0),
    0,
  );
  let offset = 0;

  return (
    <svg
      aria-hidden="true"
      className={styles.meter}
      data-compact={compact ? "true" : undefined}
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 100 1"
    >
      {total > 0
        ? segments.map((segment) => {
            const width = (Math.max(segment.minutes, 0) / total) * 100;
            const x = offset;
            offset += width;
            return width > 0 ? (
              <rect
                className={styles.segment}
                data-kind={segment.kind}
                height="1"
                key={segment.kind}
                width={width}
                x={x}
                y="0"
              />
            ) : null;
          })
        : null}
    </svg>
  );
}
