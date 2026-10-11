"use client";

import { useId, useState } from "react";
import type { PortalProjectHoursDto } from "@invessiv/common/contracts/portal/portal-project-hours.dto";
import { formatDuration } from "@invessiv/common/patterns/crm/hours/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import { TimeEntryListLoadStatus } from "@/common/constants/crm/time-entry-list-load-status";
import { groupTimeEntriesByMonth } from "@/common/patterns/portal/group-time-entries-by-month";
import type { Locale } from "@/config/i18n";
import { usePortalTimeEntries } from "@/hooks/portal/use-portal-time-entries";
import type { PortalHoursDictionary } from "@/i18n/dictionaries/portal";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import { formatCalendarMonth } from "@/lib/i18n/format-calendar-month";
import styles from "./portal-time-entry-list.module.css";

export type PortalTimeEntryListProps = {
  content: PortalHoursDictionary["entries"];
  customerId: string;
  locale: Locale;
  /** The projects the filter offers; entries of any other project carry no project reference. */
  projects: readonly PortalProjectHoursDto[];
};

/**
 * What the time was used for, newest first and grouped by month. It is only mounted for readers
 * who may see single entries, so its first request is also the first one for time entries at all.
 * Descriptions and task titles are rendered as plain text.
 */
export function PortalTimeEntryList({
  content,
  customerId,
  locale,
  projects,
}: PortalTimeEntryListProps) {
  const headingId = useId();
  const list = usePortalTimeEntries(
    customerId,
    projects.map((project) => project.projectId),
  );
  const [announcement, setAnnouncement] = useState("");
  const filtered = list.projectId !== null;

  function selectProject(projectId: string | null) {
    setAnnouncement("");
    list.selectProject(projectId);
  }

  async function loadMore() {
    setAnnouncement("");
    const count = await list.loadMore();
    if (count === null) setAnnouncement(content.moreError);
    else if (count === 1) setAnnouncement(content.loadedOne);
    else if (count > 1)
      setAnnouncement(formatMessage(content.loaded, { count: String(count) }));
  }

  /** Without a filter each entry says where it belongs; a hidden project has only a shared label. */
  function projectLabel(projectId: string | null): string | null {
    if (filtered) return null;
    if (projectId === null) return content.earlier;
    return (
      projects.find((project) => project.projectId === projectId)?.title ?? null
    );
  }

  return (
    <section
      aria-busy={list.status === TimeEntryListLoadStatus.Loading}
      aria-labelledby={headingId}
      className={styles.entries}
    >
      <h3 className={styles.heading} id={headingId}>
        {content.title}
      </h3>

      {projects.length > 0 ? (
        <div
          aria-label={content.filterLabel}
          className={styles.filter}
          role="group"
        >
          <button
            aria-pressed={!filtered}
            className={styles.chip}
            onClick={() => selectProject(null)}
            type="button"
          >
            {content.allProjects}
          </button>
          {projects.map((project) => (
            <button
              aria-pressed={list.projectId === project.projectId}
              className={styles.chip}
              key={project.projectId}
              onClick={() => selectProject(project.projectId)}
              type="button"
            >
              {project.title}
            </button>
          ))}
        </div>
      ) : null}

      {list.status === TimeEntryListLoadStatus.Loading ? (
        <p className={styles.hint}>{content.loading}</p>
      ) : list.status === TimeEntryListLoadStatus.Error ? (
        <div className={styles.loadError} role="alert">
          <p>{content.loadError}</p>
          <ButtonControl onClick={list.retry} type="button" variant="ghost">
            {content.retry}
          </ButtonControl>
        </div>
      ) : list.entries.length === 0 ? (
        <p className={styles.hint}>
          {filtered ? content.emptyFiltered : content.empty}
        </p>
      ) : (
        <div className={styles.months}>
          {groupTimeEntriesByMonth(list.entries).map((group) => (
            <div className={styles.month} key={group.month}>
              <h4 className={styles.monthHeading}>
                {formatCalendarMonth(group.month, locale)}
              </h4>
              <ul className={styles.list}>
                {group.entries.map((entry) => {
                  const project = projectLabel(entry.projectId);
                  return (
                    <li className={styles.row} key={entry.id}>
                      <span className={styles.date}>
                        {formatCalendarDay(entry.performedOn, locale)}
                      </span>
                      <span className={styles.text}>
                        <span className={styles.description}>
                          {entry.description}
                        </span>
                        {entry.taskTitle ? (
                          <span className={styles.meta}>
                            {formatMessage(content.task, {
                              title: entry.taskTitle,
                            })}
                          </span>
                        ) : null}
                        {project ? (
                          <span className={styles.meta}>{project}</span>
                        ) : null}
                      </span>
                      <span className={styles.amount}>
                        <span
                          className={styles.duration}
                          data-goodwill={entry.billable ? undefined : "true"}
                        >
                          {formatDuration(entry.durationMinutes)}
                        </span>
                        {entry.billable ? null : (
                          <span className={styles.goodwill}>
                            {content.goodwill}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {list.hasMore ? (
        <div className={styles.more}>
          <ButtonControl
            disabled={list.loadingMore}
            onClick={() => void loadMore()}
            type="button"
            variant="ghost"
          >
            {list.loadingMore ? content.loadingMore : content.more}
          </ButtonControl>
        </div>
      ) : null}
      <p aria-live="polite" className={styles.announcement} role="status">
        {announcement}
      </p>
    </section>
  );
}
