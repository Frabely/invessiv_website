import { faArrowRightLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CSSProperties } from "react";
import type { Locale } from "../../../../config/i18n";
import { formatIntegerCount } from "../../../../lib/workspace/dashboard/format-integer";
import styles from "./funnel-connector.module.css";

type FunnelConnectorProps = {
  ariaLabel: string;
  index: number;
  locale: Locale;
  nextCount: number;
  previousCount: number;
};

function formatTransitionLabel(
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

  return `${formatIntegerCount(normalizedNextCount, locale)} / ${formatIntegerCount(normalizedPreviousCount, locale)} · ${formatIntegerCount(percentValue, locale)} %`;
}

export function FunnelConnector({
  ariaLabel,
  index,
  locale,
  nextCount,
  previousCount,
}: FunnelConnectorProps) {
  const formattedForwarded = formatTransitionLabel(
    previousCount,
    nextCount,
    locale,
  );

  return (
    <div
      aria-label={ariaLabel}
      className={styles.connector}
      data-slot="funnel-connector"
      role="presentation"
      style={
        {
          "--connector-delay": `${0.18 + index * 0.1}s`,
        } as CSSProperties
      }
    >
      <div className={styles.connectorLabel}>
        <span aria-hidden="true" className={styles.connectorChevron}>
          <FontAwesomeIcon icon={faArrowRightLong} />
        </span>
        <span className={styles.connectorRatio}>{formattedForwarded}</span>
        <span className={styles.connectorMeta}>
          {formatIntegerCount(previousCount, locale)} →{" "}
          {formatIntegerCount(nextCount, locale)}
        </span>
      </div>
    </div>
  );
}
