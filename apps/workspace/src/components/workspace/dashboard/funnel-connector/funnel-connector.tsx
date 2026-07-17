import type { CSSProperties } from "react";
import type { LeadBadgeTone as LeadBadgeToneValue } from "@invessiv/common/constants/leads/badges/lead-badge-tones";
import type { Locale } from "@invessiv/common";
import { formatIntegerCount } from "@/lib/workspace/dashboard/format-integer";
import styles from "./funnel-connector.module.css";

type FunnelConnectorProps = {
  ariaLabel: string;
  index: number;
  locale: Locale;
  nextCount: number;
  nextStageTone: LeadBadgeToneValue;
  previousCount: number;
  previousStageTone: LeadBadgeToneValue;
  ratioLabel?: string;
  showAreaFade?: boolean;
};

function formatPercentLabel(
  previousCount: number,
  nextCount: number,
  locale: Locale,
): string {
  const normalizedPreviousCount = previousCount > 0 ? previousCount : 0;
  const normalizedNextCount = previousCount > 0 ? nextCount : 0;
  const percentValue =
    normalizedPreviousCount === 0
      ? 0
      : Math.round((normalizedNextCount / normalizedPreviousCount) * 100);

  return `${formatIntegerCount(percentValue, locale)} %`;
}

function formatRatioLabel(
  previousCount: number,
  nextCount: number,
  locale: Locale,
): string {
  const normalizedPreviousCount = previousCount > 0 ? previousCount : 0;
  const normalizedNextCount = previousCount > 0 ? nextCount : 0;

  return `${formatIntegerCount(normalizedNextCount, locale)} / ${formatIntegerCount(normalizedPreviousCount, locale)}`;
}

export function FunnelConnector({
  ariaLabel,
  index,
  locale,
  nextCount,
  nextStageTone,
  previousCount,
  previousStageTone,
  ratioLabel,
  showAreaFade = false,
}: FunnelConnectorProps) {
  const percentLabel = formatPercentLabel(previousCount, nextCount, locale);
  const resolvedRatioLabel =
    ratioLabel ?? formatRatioLabel(previousCount, nextCount, locale);

  return (
    <div
      aria-label={ariaLabel}
      className={styles.connector}
      data-area-fade={showAreaFade ? "true" : "false"}
      data-from-tone={previousStageTone}
      data-slot="funnel-connector"
      data-tone={nextStageTone}
      role="presentation"
      style={
        {
          "--connector-delay": `${0.18 + index * 0.1}s`,
        } as CSSProperties
      }
    >
      <span aria-hidden="true" className={styles.connectorLine} />
      <div className={styles.connectorBadge}>
        <span className={styles.connectorPercent}>{percentLabel}</span>
        <span className={styles.connectorRatio}>{resolvedRatioLabel}</span>
      </div>
      <span aria-hidden="true" className={styles.connectorLine} />
    </div>
  );
}
