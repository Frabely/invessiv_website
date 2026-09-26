"use client";

import { useEffect, useRef } from "react";
import {
  faArchive,
  faCalendarDays,
  faCheck,
  faCircleCheck,
  faCirclePause,
  faCircleXmark,
  faFlagCheckered,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import {
  BadgeTone,
  type BadgeTone as BadgeToneValue,
} from "@invessiv/common/constants/ui/badge-tones";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { Badge, ButtonControl } from "@invessiv/ui";
import { getMemberInitials } from "@/common/patterns/access/member-initials";
import type { CrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { OwnerWithoutAccessBadge } from "@/components/workspace/crm/shared/owner-without-access-badge/owner-without-access-badge";
import { formatMessage } from "@/lib/i18n/format-message";
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
  const currentStepRef = useRef<HTMLLIElement>(null);
  const currentIndex = project
    ? Math.max(project.processSteps.indexOf(project.currentProcessStep), 0)
    : 0;

  useEffect(() => {
    currentStepRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [project?.id, project?.currentProcessStep]);

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
          <div className={styles.progress}>
            <p className={styles.progressSummary}>
              <strong>{project.processSteps[currentIndex]}</strong>
              <span>
                {formatMessage(content.projects.phaseProgress, {
                  current: currentIndex + 1,
                  total: project.processSteps.length,
                })}
              </span>
            </p>
            <ol aria-label={content.projects.phase} className={styles.track}>
              {project.processSteps.map((step, index) => {
                const state =
                  index < currentIndex
                    ? "complete"
                    : index === currentIndex
                      ? "current"
                      : "upcoming";
                const body = (
                  <>
                    <span aria-hidden="true" className={styles.segment} />
                    <span className={styles.label}>
                      {state === "complete" ? (
                        <FontAwesomeIcon
                          aria-hidden="true"
                          className={styles.check}
                          icon={faCheck}
                        />
                      ) : null}
                      {step}
                    </span>
                  </>
                );
                return (
                  <li
                    aria-current={state === "current" ? "step" : undefined}
                    className={styles.step}
                    data-state={state}
                    key={`${step}-${index}`}
                    ref={state === "current" ? currentStepRef : undefined}
                  >
                    {onEditAction ? (
                      <button
                        className={styles.stepButton}
                        onClick={() => onEditAction(project, step)}
                        type="button"
                      >
                        {body}
                      </button>
                    ) : (
                      <span className={styles.stepBody}>{body}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
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
