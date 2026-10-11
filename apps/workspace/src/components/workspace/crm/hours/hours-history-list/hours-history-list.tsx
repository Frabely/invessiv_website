import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import type { CustomerHoursProjectDto } from "@invessiv/common/contracts/crm/hours/customer-hours-project.dto";
import type { HourAllocationDto } from "@invessiv/common/contracts/crm/hours/hour-allocation.dto";
import type { HourPurchaseDto } from "@invessiv/common/contracts/crm/hours/hour-purchase.dto";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { Locale } from "@/config/i18n";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import styles from "./hours-history-list.module.css";

export type HoursHistoryListProps = {
  allocations: readonly HourAllocationDto[];
  content: CrmHoursDictionary["history"];
  locale: Locale;
  projects: readonly CustomerHoursProjectDto[];
  purchases: readonly HourPurchaseDto[];
};

/** A leading sign on every line: the lists are ledgers, and the direction is the point. */
function signed(minutes: number): string {
  return minutes > 0 ? `+${formatDuration(minutes)}` : formatDuration(minutes);
}

/** The immutable lines behind the figures: what was added, and where it went. */
export function HoursHistoryList({
  allocations,
  content,
  locale,
  projects,
  purchases,
}: HoursHistoryListProps) {
  const projectTitles = new Map(
    projects.map((project) => [project.projectId, project.title]),
  );
  const capped =
    purchases.length >= HoursLimits.HistoryPreviewSize ||
    allocations.length >= HoursLimits.HistoryPreviewSize;

  return (
    <div className={styles.history}>
      {purchases.length > 0 ? (
        <section className={styles.group}>
          <h4>{content.purchasesTitle}</h4>
          <ul className={styles.lines}>
            {purchases.map((purchase) => (
              <li className={styles.line} key={purchase.id}>
                <span className={styles.date}>
                  {formatCalendarDay(purchase.purchasedOn, locale)}
                </span>
                <span className={styles.text}>
                  {purchase.kind === HourPurchaseKind.Correction
                    ? [content.correction, purchase.note]
                        .filter(Boolean)
                        .join(": ")
                    : purchase.note}
                </span>
                <span
                  className={styles.amount}
                  data-negative={purchase.minutes < 0 ? "true" : undefined}
                >
                  {signed(purchase.minutes)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {allocations.length > 0 ? (
        <section className={styles.group}>
          <h4>{content.allocationsTitle}</h4>
          <ul className={styles.lines}>
            {allocations.map((allocation) => (
              <li className={styles.line} key={allocation.id}>
                <span className={styles.date}>
                  {formatMomentDay(allocation.createdAt, locale)}
                </span>
                <span className={styles.text}>
                  {[
                    projectTitles.get(allocation.projectId),
                    allocation.minutes > 0
                      ? content.allocated
                      : content.released,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  {allocation.note ? (
                    <span className={styles.note}>{allocation.note}</span>
                  ) : null}
                </span>
                <span
                  className={styles.amount}
                  data-negative={allocation.minutes < 0 ? "true" : undefined}
                >
                  {signed(allocation.minutes)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {capped ? (
        <p className={styles.capped}>
          {formatMessage(content.capped, {
            count: String(HoursLimits.HistoryPreviewSize),
          })}
        </p>
      ) : null}
    </div>
  );
}
