"use client";

import { useState } from "react";
import { faStopwatch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { CustomerHoursProjectDto } from "@invessiv/common/contracts/crm/hours/customer-hours-project.dto";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, PrimaryCtaButton } from "@invessiv/ui";
import { HourAllocationDirection } from "@/common/constants/crm/hour-allocation-directions";
import type { TimeEntryTaskOption } from "@/common/contracts/crm/hours/time-entry-task-option";
import { CollapsibleSection } from "@/components/workspace/crm/shared/collapsible-section/collapsible-section";
import type { Locale } from "@/config/i18n";
import { useProjectTimeEntries } from "@/hooks/workspace/crm/use-project-time-entries";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { HourAllocationDialog } from "../hour-allocation-dialog/hour-allocation-dialog";
import { TimeEntryDeleteDialog } from "../time-entry-delete-dialog/time-entry-delete-dialog";
import { ProjectTimeEntryContent } from "./project-time-entry-content";
import { projectHoursActions } from "@/common/patterns/crm/hours/project-hours-actions";
import styles from "./project-hours-section.module.css";

export type ProjectHoursSectionProps = {
  /** True only with `hours.manage` on the customer; shows allocate and release. */
  canManage: boolean;
  /** True only when the page lists the project as writable for hours. */
  canWrite: boolean;
  content: CrmHoursDictionary;
  customerId: string;
  /** Free minutes of the customer, or null without customer-wide read access. */
  freeMinutes: number | null;
  locale: Locale;
  /** Opens the booking dialog, which lives one level up so task rows can open it too. */
  onBookAction: () => void;
  /** Called after an entry was deleted here, so sibling figures reload. */
  onChangedAction: () => void;
  onEditAction: (entry: TimeEntryDto) => void;
  project: CustomerHoursProjectDto;
  /** Increases after every write to a time entry of this project; reloads the list. */
  revision: number;
  /** Null without the right to read tasks: entries then show no task line. */
  tasks: readonly TimeEntryTaskOption[] | null;
};

/**
 * The hours of one project: what it was given, what is used, and every entry behind the figure.
 * An overdrawn project is named as such and never blocked; hours left on a finished project are
 * pointed out, never released on their own.
 */
export function ProjectHoursSection({
  canManage,
  canWrite,
  content,
  customerId,
  freeMinutes,
  locale,
  onBookAction,
  onChangedAction,
  onEditAction,
  project,
  revision,
  tasks,
}: ProjectHoursSectionProps) {
  const list = useProjectTimeEntries(project.projectId, revision);
  const [direction, setDirection] = useState<HourAllocationDirection | null>(
    null,
  );
  const [deleting, setDeleting] = useState<TimeEntryDto | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const text = content.project;
  const { canBook, canAllocate, canRelease, showFinishedHint } =
    projectHoursActions({ project, canWrite, canManage, freeMinutes });
  const overdrawn = project.remainingMinutes < 0;
  const showInlineRelease = canRelease && !showFinishedHint;

  const figures = [
    { label: text.allocated, value: project.allocatedMinutes },
    { label: text.used, value: project.usedMinutes },
    ...(project.goodwillMinutes > 0
      ? [{ label: text.goodwill, value: project.goodwillMinutes }]
      : []),
    { label: text.remainingLabel, value: project.remainingMinutes },
  ];

  async function loadMore() {
    const count = await list.loadMore();
    setAnnouncement(
      count === null
        ? text.loadError
        : formatMessage(text.moreLoaded, { count: String(count) }),
    );
  }

  return (
    <CollapsibleSection
      action={
        canBook ? (
          <PrimaryCtaButton
            className={styles.actionButton}
            onClick={onBookAction}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faStopwatch} />
            {text.bookAction}
          </PrimaryCtaButton>
        ) : null
      }
      after={
        <>
          <p aria-live="polite" className="sr-only" role="status">
            {announcement}
          </p>
          {direction ? (
            <HourAllocationDialog
              content={content}
              customerId={customerId}
              direction={direction}
              freeMinutes={freeMinutes ?? 0}
              key={direction}
              onCloseAction={() => setDirection(null)}
              projectId={project.projectId}
              projectTitle={project.title}
              releasableMinutes={project.releasableMinutes}
            />
          ) : null}
          {deleting ? (
            <TimeEntryDeleteDialog
              content={content}
              entry={deleting}
              key={deleting.id}
              locale={locale}
              onCloseAction={() => setDeleting(null)}
              onDeletedAction={onChangedAction}
            />
          ) : null}
        </>
      }
      count={formatMessage(overdrawn ? text.overdrawn : text.remaining, {
        duration: formatDuration(Math.abs(project.remainingMinutes)),
      })}
      labelCollapse={text.collapseLabel}
      labelExpand={text.expandLabel}
      title={text.title}
    >
      <div className={styles.body}>
        <div className={styles.head}>
          <dl aria-label={text.figuresLabel} className={styles.figures}>
            {figures.map((figure) => (
              <div
                data-negative={figure.value < 0 ? "true" : undefined}
                key={figure.label}
              >
                <dt>{figure.label}</dt>
                <dd>{formatDuration(figure.value)}</dd>
              </div>
            ))}
          </dl>
          {canAllocate || showInlineRelease ? (
            <div className={styles.moves}>
              {canAllocate ? (
                <ButtonControl
                  onClick={() => setDirection(HourAllocationDirection.Allocate)}
                  type="button"
                  variant="ghost"
                >
                  {content.projects.allocateAction}
                </ButtonControl>
              ) : null}
              {showInlineRelease ? (
                <ButtonControl
                  onClick={() => setDirection(HourAllocationDirection.Release)}
                  type="button"
                  variant="quiet"
                >
                  {content.projects.releaseAction}
                </ButtonControl>
              ) : null}
            </div>
          ) : null}
        </div>
        {showFinishedHint ? (
          <p className={styles.notice}>
            <span>
              {formatMessage(text.closedHint, {
                duration: formatDuration(project.releasableMinutes),
              })}
            </span>
            {canRelease ? (
              <ButtonControl
                onClick={() => setDirection(HourAllocationDirection.Release)}
                type="button"
                variant="ghost"
              >
                {content.projects.releaseAction}
              </ButtonControl>
            ) : null}
          </p>
        ) : null}
        <ProjectTimeEntryContent
          list={list}
          canBook={canBook}
          canWrite={canWrite}
          allocatedMinutes={project.allocatedMinutes}
          content={content}
          locale={locale}
          tasks={tasks}
          onDeleteAction={setDeleting}
          onEditAction={onEditAction}
          onLoadMoreAction={() => void loadMore()}
        />
      </div>
    </CollapsibleSection>
  );
}
