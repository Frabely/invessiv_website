"use client";

import { useState } from "react";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalProjectHoursDto } from "@invessiv/common/contracts/portal/portal-project-hours.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import {
  ButtonControl,
  DataTableCell,
  DataTableHeaderCell,
  DataTableLayout,
  DataTableRow,
} from "@invessiv/ui";
import { TimeEntryListLoadStatus } from "@/common/constants/crm/time-entry-list-load-status";
import type { PortalHoursEntriesDictionary } from "@/common/contracts/portal/portal-hours-entries-dictionary";
import type { Locale } from "@/config/i18n";
import { usePortalTimeEntries } from "@/hooks/portal/use-portal-time-entries";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import styles from "./portal-time-entry-list.module.css";

export type PortalTimeEntryListProps = {
  content: PortalHoursEntriesDictionary;
  customerId: string;
  locale: Locale;
  /** The project the dialog shows; null lists every project with a project column. */
  projectId: string | null;
  /** Titles for the project column; entries of any other project carry no project reference. */
  projects: readonly PortalProjectHoursDto[];
};

/**
 * What the time was used for, newest first, in the shared table: the head
 * and "load more" stay put while the rows scroll. It is only mounted for readers who may see
 * single entries, so its first request is also the first one for time entries at all.
 * Descriptions and task titles are rendered as plain text.
 */
export function PortalTimeEntryList({
  content,
  customerId,
  locale,
  projectId,
  projects,
}: PortalTimeEntryListProps) {
  const list = usePortalTimeEntries(customerId, projectId);
  const [announcement, setAnnouncement] = useState("");
  const showProject = projectId === null;
  const columns = [
    { id: "date", header: content.columns.date, width: 112 },
    { id: "description", header: content.columns.description },
    { id: "task", header: content.columns.task, width: 150 },
    ...(showProject
      ? [{ id: "project", header: content.columns.project, width: 140 }]
      : []),
    { id: "duration", header: content.columns.duration, width: 96 },
  ];

  async function loadMore() {
    setAnnouncement("");
    const count = await list.loadMore();
    if (count === null) setAnnouncement(content.moreError);
    else if (count === 1) setAnnouncement(content.loadedOne);
    else if (count > 1)
      setAnnouncement(formatMessage(content.loaded, { count: String(count) }));
  }

  /** An entry on a project the portal hides has only the shared label. */
  function projectLabel(entryProjectId: string | null): string {
    if (entryProjectId === null) return content.earlier;
    return (
      projects.find((project) => project.projectId === entryProjectId)?.title ??
      content.earlier
    );
  }

  return (
    <div
      aria-busy={list.status === TimeEntryListLoadStatus.Loading}
      className={styles.entries}
    >
      {list.status === TimeEntryListLoadStatus.Loading ? (
        <p className={styles.hint}>{content.loading}</p>
      ) : list.status === TimeEntryListLoadStatus.Error ? (
        <div className={styles.loadError} role="alert">
          <p>{content.loadError}</p>
          <ButtonControl
            onClick={list.retry}
            type="button"
            variant={ButtonVariant.Ghost}
          >
            {content.retry}
          </ButtonControl>
        </div>
      ) : list.entries.length === 0 ? (
        <p className={styles.hint}>
          {showProject ? content.empty : content.emptyFiltered}
        </p>
      ) : (
        <div className={styles.tableArea}>
          <DataTableLayout
            ariaLabel={content.tableLabel}
            caption={content.tableLabel}
            columns={columns}
            fillAvailableHeight
            footer={
              list.hasMore ? (
                <span className={styles.more}>
                  <ButtonControl
                    disabled={list.loadingMore}
                    onClick={() => void loadMore()}
                    type="button"
                    variant={ButtonVariant.Ghost}
                  >
                    {list.loadingMore ? content.loadingMore : content.more}
                  </ButtonControl>
                </span>
              ) : undefined
            }
            responsiveMode="cards"
          >
            {list.entries.map((entry) => (
              <DataTableRow key={entry.id} mobileCard>
                <DataTableCell mobileCardSlot="supportingPrimary">
                  <span className={styles.date}>
                    {formatCalendarDay(entry.performedOn, locale)}
                  </span>
                </DataTableCell>
                <DataTableHeaderCell mobileCardSlot="primary" scope="row">
                  <span className={styles.description}>
                    {entry.description}
                  </span>
                </DataTableHeaderCell>
                <DataTableCell
                  mobileCardSlot="detail"
                  mobileLabel={
                    entry.taskTitle ? content.columns.task : undefined
                  }
                >
                  {entry.taskTitle ? (
                    <span className={styles.task}>{entry.taskTitle}</span>
                  ) : null}
                </DataTableCell>
                {showProject ? (
                  <DataTableCell mobileCardSlot="supportingSecondary">
                    <span className={styles.project}>
                      {projectLabel(entry.projectId)}
                    </span>
                  </DataTableCell>
                ) : null}
                <DataTableCell mobileCardSlot="secondary">
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
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableLayout>
        </div>
      )}
      <p aria-live="polite" className={styles.announcement} role="status">
        {announcement}
      </p>
    </div>
  );
}
