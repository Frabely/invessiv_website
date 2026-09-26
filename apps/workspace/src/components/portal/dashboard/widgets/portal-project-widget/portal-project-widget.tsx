"use client";

import { useId } from "react";
import {
  faArrowUpRightFromSquare,
  faDiagramProject,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalProjectDto } from "@invessiv/common/contracts/portal/portal-project.dto";
import { ProcessTrack, TabList, Widget } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./portal-project-widget.module.css";

export type PortalProjectWidgetProps = {
  content: PortalDashboardDictionary["widgets"]["project"];
  locale: Locale;
  onSelectProjectAction: (projectId: string) => void;
  projects: readonly PortalProjectDto[];
  selectedProject: PortalProjectDto;
};

export function PortalProjectWidget({
  content,
  locale,
  onSelectProjectAction,
  projects,
  selectedProject: project,
}: PortalProjectWidgetProps) {
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const tabId = (projectId: string) => `${baseId}-tab-${projectId}`;
  const hasTabs = projects.length > 1;
  const currentIndex = project.processSteps.indexOf(project.currentProcessStep);
  const isPlanned = project.status === ProjectStatus.Planned;
  const note = isPlanned
    ? content.plannedNote
    : project.status === ProjectStatus.Paused
      ? content.pausedNote
      : null;
  const nextStep = project.nextStep;

  return (
    <Widget
      className={styles.widget}
      icon={faDiagramProject}
      meta={hasTabs ? undefined : project.title}
      openMode={WidgetOpenMode.None}
      title={content.title}
    >
      {hasTabs ? (
        <TabList
          activeValue={project.id}
          ariaLabel={content.tabsLabel}
          className={styles.tabs}
          items={projects.map((candidate) => ({
            value: candidate.id,
            id: tabId(candidate.id),
            panelId,
            label:
              candidate.status === ProjectStatus.Planned ? (
                <span className={styles.tabLabel}>
                  {candidate.title}
                  <span className={styles.soon}>{content.plannedBadge}</span>
                </span>
              ) : (
                candidate.title
              ),
          }))}
          onSelectAction={onSelectProjectAction}
        />
      ) : null}
      <div
        aria-labelledby={hasTabs ? tabId(project.id) : undefined}
        className={styles.panel}
        id={panelId}
        role={hasTabs ? "tabpanel" : undefined}
      >
        {note ? <p className={styles.note}>{note}</p> : null}
        {!isPlanned && currentIndex >= 0 ? (
          <ProcessTrack
            currentIndex={currentIndex}
            label={content.trackLabel}
            steps={project.processSteps}
            summary={
              <p className={styles.stepSummary}>
                {formatMessage(content.stepSummary, {
                  current: currentIndex + 1,
                  total: project.processSteps.length,
                })}
              </p>
            }
          />
        ) : null}
        {nextStep || project.previewUrl || project.projectLead ? (
          <div className={styles.details}>
            {nextStep ? (
              <div className={styles.nextStep}>
                <span className={styles.label}>{content.nextStep}</span>
                <span className={styles.nextStepText}>
                  {nextStep.label}
                  {nextStep.dueOn ? (
                    <time
                      className={styles.date}
                      data-standalone={nextStep.label ? undefined : true}
                      dateTime={nextStep.dueOn}
                    >
                      {formatCalendarDay(nextStep.dueOn, locale)}
                    </time>
                  ) : null}
                </span>
              </div>
            ) : null}
            {project.projectLead ? (
              <p className={styles.lead}>
                <FontAwesomeIcon aria-hidden="true" icon={faUserTie} />
                <span>
                  {content.projectLead}:{" "}
                  <strong>{project.projectLead.displayName}</strong>
                </span>
              </p>
            ) : null}
            {project.previewUrl ? (
              <a
                className={styles.preview}
                href={project.previewUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {content.preview}
                <span className="sr-only"> ({content.previewNewTab})</span>
                <FontAwesomeIcon
                  aria-hidden="true"
                  icon={faArrowUpRightFromSquare}
                />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </Widget>
  );
}
