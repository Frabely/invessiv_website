import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import { formatDuration } from "@invessiv/common/patterns/crm/hours/format-duration";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./hours-balance-summary.module.css";

export type HoursBalanceSummaryProps = {
  balance: CustomerHoursBalanceDto;
  content: CrmHoursDictionary["balance"];
};

/**
 * The customer's stock as one strip: what is used, what is allocated but still unused, what is
 * free. The strip only repeats the figures next to it — every statement also stands as text.
 */
export function HoursBalanceSummary({
  balance,
  content,
}: HoursBalanceSummaryProps) {
  const unused = Math.max(0, balance.allocatedMinutes - balance.usedMinutes);
  const free = Math.max(0, balance.freeMinutes);
  const total = balance.usedMinutes + unused + free;
  // Widths in a 0–100 viewBox, so no length ever has to be written as an inline style.
  const usedWidth = total > 0 ? (balance.usedMinutes / total) * 100 : 0;
  const unusedWidth = total > 0 ? (unused / total) * 100 : 0;

  const figures = [
    { key: "purchased", value: balance.purchasedMinutes },
    { key: "used", value: balance.usedMinutes, swatch: "used" },
    { key: "allocated", value: balance.allocatedMinutes, swatch: "unused" },
    { key: "free", value: balance.freeMinutes, swatch: "free" },
    ...(balance.goodwillMinutes > 0
      ? [{ key: "goodwill", value: balance.goodwillMinutes } as const]
      : []),
    { key: "remaining", value: balance.remainingMinutes },
  ] as const;

  return (
    <div className={styles.summary}>
      <svg
        aria-hidden="true"
        className={styles.strip}
        preserveAspectRatio="none"
        viewBox="0 0 100 4"
      >
        <rect className={styles.free} height="4" width="100" x="0" y="0" />
        <rect
          className={styles.unused}
          height="4"
          width={usedWidth + unusedWidth}
          x="0"
          y="0"
        />
        <rect
          className={styles.used}
          height="4"
          width={usedWidth}
          x="0"
          y="0"
        />
      </svg>
      <dl aria-label={content.label} className={styles.figures}>
        {figures.map((figure) => (
          <div
            className={styles.figure}
            data-negative={figure.value < 0 ? "true" : undefined}
            data-swatch={"swatch" in figure ? figure.swatch : undefined}
            key={figure.key}
          >
            <dt>{content[figure.key]}</dt>
            <dd>{formatDuration(figure.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
