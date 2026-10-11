import { useId } from "react";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import type { PortalHourPurchaseDto } from "@invessiv/common/contracts/portal/portal-hour-purchase.dto";
import { formatDuration } from "@invessiv/common/patterns/crm/hours/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { Locale } from "@/config/i18n";
import type { PortalHoursDictionary } from "@/i18n/dictionaries/portal";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import styles from "./portal-hours-purchases.module.css";

export type PortalHoursPurchasesProps = {
  content: PortalHoursDictionary["purchases"];
  locale: Locale;
  /** Newest first, already capped by the server. */
  purchases: readonly PortalHourPurchaseDto[];
};

/** When the company got how many hours. Notes are plain text written by the team. */
export function PortalHoursPurchases({
  content,
  locale,
  purchases,
}: PortalHoursPurchasesProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={styles.purchases}>
      <h3 className={styles.heading} id={headingId}>
        {content.title}
      </h3>
      {purchases.length === 0 ? (
        <p className={styles.empty}>{content.empty}</p>
      ) : (
        <ul className={styles.list}>
          {purchases.map((purchase, index) => (
            // The rows carry no id; the list is static for the lifetime of the dialog.
            <li className={styles.row} key={index}>
              <span className={styles.date}>
                {formatCalendarDay(purchase.purchasedOn, locale)}
              </span>
              <span className={styles.text}>
                {purchase.isCorrection ? (
                  <span className={styles.correction}>
                    {content.correction}
                  </span>
                ) : null}
                {purchase.note}
              </span>
              <span className={styles.amount}>
                {purchase.minutes > 0
                  ? `+${formatDuration(purchase.minutes)}`
                  : formatDuration(purchase.minutes)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {purchases.length >= HoursLimits.HistoryPreviewSize ? (
        <p className={styles.empty}>
          {formatMessage(content.capped, {
            count: String(HoursLimits.HistoryPreviewSize),
          })}
        </p>
      ) : null}
    </section>
  );
}
