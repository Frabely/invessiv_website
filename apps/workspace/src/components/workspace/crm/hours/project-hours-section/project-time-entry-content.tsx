"use client";

import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import { ButtonControl } from "@invessiv/ui";
import { TimeEntryListLoadStatus } from "@/common/constants/crm/time-entry-list-load-status";
import type { TimeEntryTaskOption } from "@/common/contracts/crm/hours/time-entry-task-option";
import { SectionEmptyState } from "@/components/workspace/crm/shared/section-empty-state/section-empty-state";
import type { Locale } from "@/config/i18n";
import type { useProjectTimeEntries } from "@/hooks/workspace/crm/use-project-time-entries";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { TimeEntryList } from "../time-entry-list/time-entry-list";
import styles from "./project-hours-section.module.css";

export type ProjectTimeEntryContentProps = {
  allocatedMinutes: number;
  canBook: boolean;
  canWrite: boolean;
  content: CrmHoursDictionary;
  list: ReturnType<typeof useProjectTimeEntries>;
  locale: Locale;
  onDeleteAction: (entry: TimeEntryDto) => void;
  onEditAction: (entry: TimeEntryDto) => void;
  onLoadMoreAction: () => void;
  tasks: readonly TimeEntryTaskOption[] | null;
};

/** Each list state is handled independently so its actions remain easy to follow. */
export function ProjectTimeEntryContent({
  allocatedMinutes,
  canBook,
  canWrite,
  content,
  list,
  locale,
  onDeleteAction,
  onEditAction,
  onLoadMoreAction,
  tasks,
}: ProjectTimeEntryContentProps) {
  const text = content.project;
  if (list.status === TimeEntryListLoadStatus.Loading) {
    return <p className={styles.state}>{text.loading}</p>;
  }
  if (list.status === TimeEntryListLoadStatus.Error) {
    return (
      <p className={styles.state} role="alert">
        {text.loadError}{" "}
        <ButtonControl onClick={list.retry} type="button" variant="quiet">
          {text.retry}
        </ButtonControl>
      </p>
    );
  }
  if (list.entries.length === 0) {
    let description = text.emptyDescription;
    if (!canBook) description = text.emptyReadOnlyDescription;
    else if (allocatedMinutes === 0) description += ` ${text.emptyUnallocated}`;
    return (
      <SectionEmptyState description={description} title={text.emptyTitle} />
    );
  }
  const taskTitles = new Map(
    (tasks ?? []).map((task) => [task.id, task.title]),
  );
  return (
    <>
      <TimeEntryList
        canWrite={canWrite}
        content={content.entry}
        entries={list.entries}
        label={text.listLabel}
        locale={locale}
        onDeleteAction={onDeleteAction}
        onEditAction={onEditAction}
        taskTitles={taskTitles}
      />
      {list.hasMore ? (
        <ButtonControl
          className={styles.more}
          disabled={list.loadingMore}
          onClick={onLoadMoreAction}
          type="button"
          variant="ghost"
        >
          {text.loadMore}
        </ButtonControl>
      ) : null}
    </>
  );
}
