"use client";

import {
  faArchive,
  faCalendarDays,
  faCircleCheck,
  faCirclePause,
  faCircleXmark,
  faFlagCheckered,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProcessTrackItemKind } from "@invessiv/common/constants/crm/process-track-item-kinds";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import {
  BadgeTone,
  type BadgeTone as BadgeToneValue,
} from "@invessiv/common/constants/ui/badge-tones";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { Badge, ButtonControl, ProcessTrack } from "@invessiv/ui";
import { getMemberInitials } from "@/common/patterns/access/member-initials";
import type { CrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { OwnerWithoutAccessBadge } from "@/components/workspace/crm/shared/owner-without-access-badge/owner-without-access-badge";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  buildProjectProcessTrack,
  toProcessTrackSteps,
} from "@invessiv/common/patterns/crm/project-process-track";
import styles from "./project-overview.module.css";

const PROJECT_STATUS_BADGE: Record<
  ProjectStatus,
  { icon: IconDefinition; tone: BadgeToneValue }
> = {
  [ProjectStatus.Planned]: { icon: faCalendarDays, tone: BadgeTone.Info },
  [ProjectStatus.Active]: { icon: faCircleCheck, tone: BadgeTone.Success },
  [ProjectStatus.Paused]: { icon: faCirclePause, tone: BadgeTone.Warning },
  [ProjectStatus.Completed]: { icon: faFlagCheckered, tone: BadgeTone.Primary },
  [ProjectStatus.Cancelled]: { icon: faCircleXmark, tone: BadgeTone.Danger },
  [ProjectStatus.Archived]: { icon: faArchive, tone: BadgeTone.Neutral },
};

export type ProjectOverviewProps = {
  content: CrmCockpitDictionary;
  title: string;
  project: ProjectDto | null;
  owner?: WorkspaceMemberDto;
  ownerWithoutAccess: boolean;
  onGrantAccessAction?: (memberId: string) => void;
  /** Absent without write access; the header then offers no edit entry points. */
  onEditAction?: (project: ProjectDto, processStep?: string) => void;
};

/** Project header of the cockpit canvas: status, title, owner and the process track. */
export function ProjectOverview({
  content,
  title,
  project,
  owner,
  ownerWithoutAccess,
  onGrantAccessAction,
  onEditAction,
}: ProjectOverviewProps) {
  const track = project
    ? buildProjectProcessTrack({
        processSteps: project.processSteps,
        currentProcessStep: project.currentProcessStep,
        feedbackRoundPositions: project.feedbackRoundPositions,
        roundLabel: (number) =>
          formatMessage(content.projects.feedbackRound.label, { number }),
      })
    : null;
  const total = track?.items.length ?? 0;
  const currentIndex = Math.min(Math.max(track?.currentIndex ?? 0, 0), total);
  const currentItem = track?.items[Math.min(currentIndex, total - 1)];

  return (
    <div className={styles.overview}>
      <div className={styles.headline}>
        <div className={styles.titleBlock}>
          <h3>{title}</h3>
          {project ? (
            <Badge
              icon={PROJECT_STATUS_BADGE[project.status].icon}
              kind="status"
              label={content.projects.status[project.status]}
              tone={PROJECT_STATUS_BADGE[project.status].tone}
            />
          ) : null}
        </div>
        {project ? (
          <ProcessTrack
            currentIndex={currentIndex}
            label={content.projects.phase}
            onStepAction={
              onEditAction
                ? (_, index) => {
                    const item = track?.items[index];
                    // Rounds are not selectable as current step; they open the editor unchanged.
                    onEditAction(
                      project,
                      item?.kind === ProcessTrackItemKind.Custom
                        ? item.label
                        : undefined,
                    );
                  }
                : undefined
            }
            steps={toProcessTrackSteps(track?.items ?? [])}
            summary={
              <p className={styles.progressSummary}>
                <strong>{currentItem?.label}</strong>
                <span>
                  {formatMessage(content.projects.phaseProgress, {
                    current: Math.min(currentIndex + 1, total),
                    total,
                  })}
                </span>
              </p>
            }
          />
        ) : null}
        <div className={styles.actions}>
          {owner ? (
            <div className={styles.owner}>
              <span aria-hidden="true" className={styles.avatar}>
                {getMemberInitials(owner.displayName)}
              </span>
              <span className={styles.ownerText}>
                <span>{content.projects.owner}</span>
                <strong>{owner.displayName}</strong>
              </span>
              {project && ownerWithoutAccess && onGrantAccessAction ? (
                <OwnerWithoutAccessBadge
                  content={content.ownerAccess}
                  onGrantAccessAction={
                    owner.active
                      ? () => onGrantAccessAction(project.ownerMemberId)
                      : undefined
                  }
                />
              ) : null}
            </div>
          ) : null}
          {project && onEditAction ? (
            <ButtonControl
              aria-label={content.projects.edit}
              className={styles.edit}
              onClick={() => onEditAction(project)}
              title={content.projects.edit}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faPen} />
            </ButtonControl>
          ) : null}
        </div>
      </div>
    </div>
  );
}
