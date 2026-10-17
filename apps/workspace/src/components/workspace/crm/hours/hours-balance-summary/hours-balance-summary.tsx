import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import type { CustomerHoursProjectDto } from "@invessiv/common/contracts/crm/hours/customer-hours-project.dto";
import { hoursDistribution } from "@invessiv/common/patterns/time/hours-distribution";
import { HoursMeter } from "@invessiv/ui";
import {
  faClock,
  faHourglassHalf,
  faCoins,
  faFolderOpen,
  faCircleCheck,
  faGift,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { HoursBalanceFigureKind } from "@/common/constants/crm/hours-balance-figure-kinds";
import type { CrmHoursBalanceDictionary } from "@/common/contracts/crm/hours/crm-hours-balance-dictionary";
import styles from "./hours-balance-summary.module.css";

export type HoursBalanceSummaryProps = {
  balance: CustomerHoursBalanceDto;
  content: CrmHoursBalanceDictionary;
  /** All customer projects, including closed projects; supplied only with customer-wide read access. */
  projects: readonly CustomerHoursProjectDto[];
};

/**
 * Customer balances with familiar icons; every figure retains its explicit text label.
 */
export function HoursBalanceSummary({
  balance,
  content,
  projects,
}: HoursBalanceSummaryProps) {
  const distribution = hoursDistribution.companyUsage({
    purchasedMinutes: balance.purchasedMinutes,
    usedMinutes: balance.usedMinutes,
    freeMinutes: balance.freeMinutes,
    openMinutes: projects.reduce(
      (sum, project) =>
        sum + hoursDistribution.projectUsage(project).openMinutes,
      0,
    ),
  });
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
      icon: faFolderOpen,
    },
    {
      key: HoursBalanceFigureKind.Open,
      value: distribution.openMinutes,
      swatch: HoursBalanceFigureKind.Open,
      icon: faFolderOpen,
    },
    ...(distribution.overMinutes > 0
      ? [
          {
            key: HoursBalanceFigureKind.Over,
            value: distribution.overMinutes,
            swatch: HoursBalanceFigureKind.Over,
            icon: faHourglassHalf,
          } as const,
        ]
      : []),
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
      <HoursMeter segments={hoursDistribution.companySegments(distribution)} />
    </div>
  );
}
