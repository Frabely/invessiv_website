import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import {
  faClock,
  faHourglassHalf,
  faCoins,
  faFolderOpen,
  faCircleCheck,
  faGift,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDuration } from "@invessiv/common/patterns/crm/hours/format-duration";
import { HoursBalanceFigureKind } from "@/common/constants/crm/hours-balance-figure-kinds";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./hours-balance-summary.module.css";

export type HoursBalanceSummaryProps = {
  balance: CustomerHoursBalanceDto;
  content: CrmHoursDictionary["balance"];
};

/**
 * Customer balances with familiar icons; every figure retains its explicit text label.
 */
export function HoursBalanceSummary({
  balance,
  content,
}: HoursBalanceSummaryProps) {
  const figures = [
    {
      key: HoursBalanceFigureKind.Purchased,
      value: balance.purchasedMinutes,
      icon: faCoins,
    },
    {
      key: HoursBalanceFigureKind.Used,
      value: balance.usedMinutes,
      swatch: HoursBalanceFigureKind.Used,
      icon: faClock,
    },
    {
      key: HoursBalanceFigureKind.Allocated,
      value: balance.allocatedMinutes,
      swatch: HoursBalanceFigureKind.Allocated,
      icon: faFolderOpen,
    },
    {
      key: HoursBalanceFigureKind.Free,
      value: balance.freeMinutes,
      swatch: HoursBalanceFigureKind.Free,
      icon: faCircleCheck,
    },
    ...(balance.goodwillMinutes > 0
      ? [
          {
            key: HoursBalanceFigureKind.Goodwill,
            value: balance.goodwillMinutes,
            icon: faGift,
          } as const,
        ]
      : []),
    {
      key: HoursBalanceFigureKind.Remaining,
      value: balance.remainingMinutes,
      icon: faHourglassHalf,
    },
  ] as const;

  return (
    <div className={styles.summary}>
      <dl aria-label={content.label} className={styles.figures}>
        {figures.map((figure) => (
          <div
            className={styles.figure}
            data-negative={figure.value < 0 ? "true" : undefined}
            data-swatch={"swatch" in figure ? figure.swatch : undefined}
            key={figure.key}
          >
            <dt>
              <FontAwesomeIcon
                aria-hidden="true"
                className={styles.icon}
                icon={figure.icon}
              />
              {content[figure.key]}
            </dt>
            <dd>{formatDuration(figure.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
