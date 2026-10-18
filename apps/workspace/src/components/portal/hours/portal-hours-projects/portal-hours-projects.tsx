import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalEarlierProjectsHoursDto } from "@invessiv/common/contracts/portal/portal-earlier-projects-hours.dto";
import type { PortalProjectHoursDto } from "@invessiv/common/contracts/portal/portal-project-hours.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { ButtonControl, HoursMeter } from "@invessiv/ui";
import { useId, type Ref } from "react";
import type { PortalHoursProjectsDictionary } from "@/common/contracts/portal/portal-hours-projects-dictionary";
import { portalHoursBreakdown } from "@/common/patterns/portal/portal-hours-breakdown";
import styles from "./portal-hours-projects.module.css";

export type PortalHoursProjectsProps = {
  content: PortalHoursProjectsDictionary;
  earlierProjects: PortalEarlierProjectsHoursDto | null;
  projects: readonly PortalProjectHoursDto[];
  /** Receives the row of `returnProjectId`, so focus can land on it when coming back. */
  returnRowRef: Ref<HTMLButtonElement>;
  /** The project the reader came back from; its row takes the ref. */
  returnProjectId: string | null;
  /** Opens one project in the dialog. */
  onSelectProjectAction: (projectId: string) => void;
};

/**
 * How the company's hours split over the projects. Each visible project is a row that opens it;
 * the earlier projects are one sum that cannot be opened. Overdrawn is always said in words.
 */
export function PortalHoursProjects({
  content,
  earlierProjects,
  projects,
  returnRowRef,
  returnProjectId,
  onSelectProjectAction,
}: PortalHoursProjectsProps) {
  const headingId = useId();

  function body(
    title: string,
    hint: string | null,
    overText: string,
    figures: PortalProjectHoursDto | PortalEarlierProjectsHoursDto,
  ) {
    const usage = portalHoursBreakdown.projectUsage(figures);
    return (
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        {hint ? <span className={styles.hint}>{hint}</span> : null}
        <span className={styles.usage}>
          {formatMessage(content.usage, {
            used: formatDuration(figures.usedMinutes),
            allocated: formatDuration(figures.allocatedMinutes),
          })}
        </span>
        {usage.overMinutes > 0 ? (
          <span className={styles.over}>
            {formatMessage(overText, {
              duration: formatDuration(usage.overMinutes),
            })}
          </span>
        ) : null}
        <HoursMeter
          compact
          segments={portalHoursBreakdown.projectSegments(figures)}
        />
      </span>
    );
  }

  return (
    <section aria-labelledby={headingId} className={styles.projects}>
      <h3 className={styles.heading} id={headingId}>
        {content.title}
      </h3>
      <ul className={styles.list}>
        {projects.map((project) => (
          <li key={project.projectId}>
            <ButtonControl
              onClick={() => onSelectProjectAction(project.projectId)}
              ref={
                project.projectId === returnProjectId ? returnRowRef : undefined
              }
              type="button"
              variant={ButtonVariant.Row}
            >
              {body(project.title, null, content.projectOver, project)}
              <FontAwesomeIcon
                aria-hidden="true"
                className={styles.chevron}
                icon={faChevronRight}
              />
            </ButtonControl>
          </li>
        ))}
        {earlierProjects ? (
          <li className={styles.earlier}>
            {body(
              content.earlier,
              content.earlierHint,
              content.earlierOver,
              earlierProjects,
            )}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
