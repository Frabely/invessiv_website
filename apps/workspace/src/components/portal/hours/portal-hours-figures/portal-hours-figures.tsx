import {
  faCircleCheck,
  faClock,
  faCoins,
  faFolder,
  faFolderOpen,
  faHourglassHalf,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import type { PortalProjectHoursDto } from "@invessiv/common/contracts/portal/portal-project-hours.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { HoursBalanceFigureKind } from "@/common/constants/crm/hours-balance-figure-kinds";
import type { PortalHoursFiguresDictionary } from "@/common/contracts/portal/portal-hours-figures-dictionary";
import { portalHoursBreakdown } from "@/common/patterns/portal/portal-hours-breakdown";
import { HoursMeter } from "@invessiv/ui";
import styles from "./portal-hours-figures.module.css";

export type PortalHoursFiguresProps = {
  content: PortalHoursFiguresDictionary;
  hours: PortalHoursDto;
  /** The chosen project; null shows how the company's purchased hours split. */
  project: PortalProjectHoursDto | null;
};

type Figure = {
  /** Picks the colour of the icon; matches the bar segment it stands for. */
  key: HoursBalanceFigureKind;
  label: string;
  minutes: number;
  icon: IconDefinition;
};

/**
 * The figures above the bar, in the cockpit's colours; the coloured icons double as its legend.
 * The company splits into used, open in projects and free; a project into assigned, used and
 * left. Overdrawn is always said in a sentence as well; colour and bar only repeat it.
 */
export function PortalHoursFigures({
  content,
  hours,
  project,
}: PortalHoursFiguresProps) {
  const breakdown = portalHoursBreakdown.of(hours);
  const figures: Figure[] = project
    ? [
        {
          key: HoursBalanceFigureKind.Allocated,
          label: content.allocated,
          minutes: project.allocatedMinutes,
          icon: faFolder,
        },
        {
          key: HoursBalanceFigureKind.Used,
          label: content.used,
          minutes: project.usedMinutes,
          icon: faClock,
        },
        {
          key: HoursBalanceFigureKind.Remaining,
          label: content.remaining,
          minutes: project.remainingMinutes,
          icon: faHourglassHalf,
        },
      ]
    : [
        {
          key: HoursBalanceFigureKind.Purchased,
          label: content.purchased,
          minutes: breakdown.purchasedMinutes,
          icon: faCoins,
        },
        {
          key: HoursBalanceFigureKind.Used,
          label: content.used,
          minutes: breakdown.usedMinutes,
          icon: faClock,
        },
        // The red part of the bar needs its legend, even while the company still has hours left.
        ...(breakdown.overMinutes > 0
          ? [
              {
                key: HoursBalanceFigureKind.Over,
                label: content.overrun,
                minutes: breakdown.overMinutes,
                icon: faHourglassHalf,
              },
            ]
          : []),
        {
          key: HoursBalanceFigureKind.Open,
          label: content.open,
          minutes: breakdown.openMinutes,
          icon: faFolderOpen,
        },
        {
          key: HoursBalanceFigureKind.Free,
          label: content.free,
          minutes: breakdown.freeMinutes,
          icon: faCircleCheck,
        },
      ];
  const overMinutes = project
    ? -project.remainingMinutes
    : -hours.balance.remainingMinutes;

  return (
    <div
      aria-label={
        project
          ? formatMessage(content.projectLabel, { project: project.title })
          : content.label
      }
      className={styles.figures}
      role="group"
    >
      <dl className={styles.list} data-count={figures.length}>
        {figures.map((figure) => (
          <div
            className={styles.figure}
            data-figure={figure.key}
            data-over={figure.minutes < 0 ? "true" : undefined}
            key={figure.key}
          >
            <dt>
              <FontAwesomeIcon
                aria-hidden="true"
                className={styles.icon}
                icon={figure.icon}
              />
              {figure.label}
            </dt>
            <dd>{formatDuration(figure.minutes)}</dd>
          </div>
        ))}
      </dl>
      <HoursMeter
        segments={
          project
            ? portalHoursBreakdown.projectSegments(project)
            : portalHoursBreakdown.companySegments(breakdown)
        }
      />
      {overMinutes > 0 ? (
        <p className={styles.note}>
          {formatMessage(project ? content.projectOver : content.over, {
            duration: formatDuration(overMinutes),
          })}
        </p>
      ) : null}
    </div>
  );
}
