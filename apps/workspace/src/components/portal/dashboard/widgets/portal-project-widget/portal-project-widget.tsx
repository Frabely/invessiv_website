"use client";

import {
  faArrowUpRightFromSquare,
  faRoute,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { ProcessTrackDensity } from "@invessiv/common/constants/ui/process-track-densities";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalProjectDto } from "@invessiv/common/contracts/portal/portal-project.dto";
import { ButtonLink, ProcessTrack, Widget } from "@invessiv/ui";
import { PORTAL_WIDGET_ACCENTS } from "@/common/constants/portal/portal-widget-accents";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import type { Locale } from "@/config/i18n";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  buildProjectProcessTrack,
  toProcessTrackSteps,
} from "@invessiv/common/patterns/crm/project-process-track";
import styles from "./portal-project-widget.module.css";

export type PortalProjectWidgetProps = {
  content: PortalDashboardDictionary["widgets"]["project"];
  locale: Locale;
  selectedProject: PortalProjectDto;
};

export function PortalProjectWidget({
  content,
  locale,
  selectedProject: project,
}: PortalProjectWidgetProps) {
  const track = buildProjectProcessTrack({
    processSteps: project.processSteps,
    currentProcessStep: project.currentProcessStep,
    feedbackRoundPositions: project.feedbackRoundPositions,
    roundProgress: project.roundProgress,
    roundLabel: (number) => formatMessage(content.feedbackRound, { number }),
  });
  const total = track.items.length;
  const isPlanned = project.status === ProjectStatus.Planned;
  const note = isPlanned
    ? content.plannedNote
    : project.status === ProjectStatus.Paused
      ? content.pausedNote
      : null;
  const nextStep = project.nextStep;

  return (
    <Widget
      accent={PORTAL_WIDGET_ACCENTS[PortalWidgetKey.Project]}
      footer={
        project.previewUrl ? (
          <ButtonLink
            href={project.previewUrl}
            rel="noopener noreferrer"
            size={ButtonSize.Control}
            target="_blank"
            variant={ButtonVariant.Primary}
          >
            <span>
              {content.preview}
              <span className="sr-only"> ({content.previewNewTab})</span>
            </span>
            <FontAwesomeIcon
              aria-hidden="true"
              icon={faArrowUpRightFromSquare}
            />
          </ButtonLink>
        ) : undefined
      }
      icon={faRoute}
      meta={project.title}
      openMode={WidgetOpenMode.None}
      title={content.title}
    >
      <div className={styles.panel}>
        {note ? <p className={styles.note}>{note}</p> : null}
        {!isPlanned && track.currentIndex >= 0 ? (
          <ProcessTrack
            currentIndex={track.currentIndex}
            density={ProcessTrackDensity.Compact}
            label={content.trackLabel}
            steps={toProcessTrackSteps(
              track.items,
              track.currentIndex,
              content.stepStatus,
            )}
            summary={
              <p className={styles.stepSummary}>
                <strong>
                  {track.items[Math.min(track.currentIndex, total - 1)]?.label}
                </strong>
                <span>
                  {formatMessage(content.stepSummary, {
                    current: Math.min(track.currentIndex + 1, total),
                    total,
                  })}
                </span>
              </p>
            }
          />
        ) : null}
        {nextStep || project.projectLead ? (
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
          </div>
        ) : null}
      </div>
    </Widget>
  );
}
