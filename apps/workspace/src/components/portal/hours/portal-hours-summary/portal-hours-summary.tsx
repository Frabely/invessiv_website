import { useId } from "react";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { PortalHoursDictionary } from "@/i18n/dictionaries/portal";
import styles from "./portal-hours-summary.module.css";

export type PortalHoursSummaryProps = {
  content: PortalHoursDictionary["summary"];
  hours: PortalHoursDto;
};

type ProjectRow = {
  key: string;
  title: string;
  hint: string | null;
  overText: string;
  allocatedMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
};

/**
 * The company's balance and how it splits over the projects. An overdrawn value is always said in
 * a sentence as well; the colour only repeats it.
 */
export function PortalHoursSummary({
  content,
  hours,
}: PortalHoursSummaryProps) {
  const headingId = useId();
  const projectsHeadingId = useId();
  const { balance, earlierProjects, projects } = hours;

  const rows: ProjectRow[] = projects.map((project) => ({
    key: project.projectId,
    title: project.title,
    hint: null,
    overText: content.projectOver,
    allocatedMinutes: project.allocatedMinutes,
    usedMinutes: project.usedMinutes,
    remainingMinutes: project.remainingMinutes,
  }));
  if (earlierProjects)
    rows.push({
      key: "earlier",
      title: content.earlier,
      hint: content.earlierHint,
      overText: content.earlierOver,
      ...earlierProjects,
    });

  return (
    <section className={styles.summary}>
      <h3 className={styles.heading} id={headingId}>
        {content.title}
      </h3>
      <div aria-labelledby={headingId} role="group">
        <dl className={styles.totals}>
          <div className={styles.figure}>
            <dt>{content.purchased}</dt>
            <dd>{formatDuration(balance.purchasedMinutes)}</dd>
          </div>
          <div className={styles.figure}>
            <dt>{content.used}</dt>
            <dd>{formatDuration(balance.usedMinutes)}</dd>
          </div>
          <div
            className={styles.figure}
            data-emphasis="true"
            data-over={balance.remainingMinutes < 0 ? "true" : undefined}
          >
            <dt>{content.remaining}</dt>
            <dd>{formatDuration(balance.remainingMinutes)}</dd>
          </div>
        </dl>
      </div>
      {balance.remainingMinutes < 0 ? (
        <p className={styles.note} data-over="true">
          {formatMessage(content.over, {
            duration: formatDuration(-balance.remainingMinutes),
          })}
        </p>
      ) : null}
      {balance.unassignedMinutes > 0 ? (
        <p className={styles.note}>
          {formatMessage(content.unassigned, {
            duration: formatDuration(balance.unassignedMinutes),
          })}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className={styles.projects}>
          <h4 className={styles.subheading} id={projectsHeadingId}>
            {content.projectsTitle}
          </h4>
          <table aria-labelledby={projectsHeadingId} className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{content.project}</th>
                <th scope="col">{content.allocated}</th>
                <th scope="col">{content.used}</th>
                <th scope="col">{content.remaining}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">
                    <span className={styles.projectTitle}>{row.title}</span>
                    {row.hint ? (
                      <span className={styles.projectHint}>{row.hint}</span>
                    ) : null}
                    {row.remainingMinutes < 0 ? (
                      <span className={styles.projectHint} data-over="true">
                        {formatMessage(row.overText, {
                          duration: formatDuration(-row.remainingMinutes),
                        })}
                      </span>
                    ) : null}
                  </th>
                  <td data-label={content.allocated}>
                    {formatDuration(row.allocatedMinutes)}
                  </td>
                  <td data-label={content.used}>
                    {formatDuration(row.usedMinutes)}
                  </td>
                  <td
                    data-label={content.remaining}
                    data-over={row.remainingMinutes < 0 ? "true" : undefined}
                  >
                    {formatDuration(row.remainingMinutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
