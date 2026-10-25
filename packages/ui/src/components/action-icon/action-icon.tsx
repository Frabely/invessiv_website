import { useId } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import styles from "./action-icon.module.css";

export type ActionIconProps = {
  icon: IconDefinition;
};

export function ActionIcon({ icon }: ActionIconProps) {
  const gradientId = useId();
  const [width, height, , , pathData] = icon.icon;
  const paths = (Array.isArray(pathData) ? pathData : [pathData]).map((d) => (
    <path d={d} key={d} />
  ));

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={styles.icon}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" className={styles.start} />
          <stop offset="28%" className={styles.middle} />
          <stop offset="100%" className={styles.end} />
        </linearGradient>
      </defs>
      <g fill="currentColor">{paths}</g>
      <g className={styles.gradient} fill={`url(#${gradientId})`}>
        {paths}
      </g>
    </svg>
  );
}
