import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowTrendDown,
  faArrowTrendUp,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";
import { KpiTrend } from "@/common/constants/dashboard/kpi-trend";
import type { KpiCardComparison } from "@/common/contracts/dashboard/kpi-card-comparison";
import styles from "./kpi-card.module.css";

export type KpiCardProps = {
  title: string;
  value: ReactNode;
  badge?: ReactNode;
  comparison?: KpiCardComparison;
  subText?: ReactNode;
  sparkline?: ReactNode;
};

const TREND_ICON: Record<KpiTrend, IconDefinition> = {
  [KpiTrend.Up]: faArrowTrendUp,
  [KpiTrend.Down]: faArrowTrendDown,
  [KpiTrend.Flat]: faMinus,
};

export function KpiCard({
  title,
  value,
  badge,
  comparison,
  subText,
  sparkline,
}: KpiCardProps) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {badge ? (
          <span className={styles.badge} data-slot="badge">
            {badge}
          </span>
        ) : null}
      </header>
      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
        {sparkline ? (
          <span
            aria-hidden="true"
            className={styles.sparkline}
            data-slot="sparkline"
          >
            {sparkline}
          </span>
        ) : null}
      </div>
      {comparison ? (
        <p className={styles.comparison} data-trend={comparison.trend}>
          <span aria-hidden="true" className={styles.trendGlyph}>
            <FontAwesomeIcon icon={TREND_ICON[comparison.trend]} />
          </span>
          <span className={styles.delta}>{comparison.formattedDelta}</span>
          <span className={styles.comparisonDescription}>
            {comparison.description}
          </span>
        </p>
      ) : null}
      {subText ? (
        <p className={styles.subText} data-slot="sub">
          {subText}
        </p>
      ) : null}
    </article>
  );
}
