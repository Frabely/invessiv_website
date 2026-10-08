import { HOURS_CLOSED_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/crm/hours-closed-project-statuses";
import type { CustomerHoursProjectDto } from "@invessiv/common/contracts/crm/hours/customer-hours-project.dto";
import { formatDuration } from "@invessiv/common/patterns/crm/hours/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import { HourAllocationDirection } from "@/common/constants/crm/hour-allocation-directions";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./hours-project-list.module.css";

export type HoursProjectListProps = {
  /** False hides both actions; they are never shown disabled. */
  canManage: boolean;
  content: CrmHoursDictionary["projects"];
  /** Free minutes of the customer; without any, nothing can be allocated. */
  freeMinutes: number;
  onMoveAction: (
    project: CustomerHoursProjectDto,
    direction: HourAllocationDirection,
  ) => void;
  projects: readonly CustomerHoursProjectDto[];
};

/** One row per project: what it was given, what it used, what is left — and the two movements. */
export function HoursProjectList({
  canManage,
  content,
  freeMinutes,
  onMoveAction,
  projects,
}: HoursProjectListProps) {
  return (
    <ul aria-label={content.title} className={styles.list}>
      {projects.map((project) => {
        const closed = HOURS_CLOSED_PROJECT_STATUS_VALUES.includes(
          project.status,
        );
        const canAllocate = canManage && !closed && freeMinutes > 0;
        const canRelease = canManage && project.releasableMinutes > 0;

        return (
          <li className={styles.item} key={project.projectId}>
            <p className={styles.title}>
              {project.title}
              {project.remainingMinutes < 0 ? (
                <span className={styles.note} data-tone="attention">
                  {formatMessage(content.overdrawn, {
                    duration: formatDuration(-project.remainingMinutes),
                  })}
                </span>
              ) : null}
              {closed ? (
                <span className={styles.note}>{content.closed}</span>
              ) : null}
            </p>
            <dl className={styles.figures}>
              <div>
                <dt>{content.allocated}</dt>
                <dd>{formatDuration(project.allocatedMinutes)}</dd>
              </div>
              <div>
                <dt>{content.used}</dt>
                <dd>{formatDuration(project.usedMinutes)}</dd>
              </div>
              <div
                data-negative={
                  project.remainingMinutes < 0 ? "true" : undefined
                }
              >
                <dt>{content.remaining}</dt>
                <dd>{formatDuration(project.remainingMinutes)}</dd>
              </div>
            </dl>
            {canAllocate || canRelease ? (
              <div className={styles.actions}>
                {canAllocate ? (
                  <ButtonControl
                    aria-label={formatMessage(content.allocateNamed, {
                      project: project.title,
                    })}
                    onClick={() =>
                      onMoveAction(project, HourAllocationDirection.Allocate)
                    }
                    type="button"
                    variant="ghost"
                  >
                    {content.allocateAction}
                  </ButtonControl>
                ) : null}
                {canRelease ? (
                  <ButtonControl
                    aria-label={formatMessage(content.releaseNamed, {
                      project: project.title,
                    })}
                    onClick={() =>
                      onMoveAction(project, HourAllocationDirection.Release)
                    }
                    type="button"
                    variant="quiet"
                  >
                    {content.releaseAction}
                  </ButtonControl>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
