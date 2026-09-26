"use client";

import {
  faArrowUpRightFromSquare,
  faFlagCheckered,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalCompletedProjectDto } from "@invessiv/common/contracts/portal/portal-completed-project.dto";
import { Widget } from "@invessiv/ui";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./portal-completed-projects-widget.module.css";

export type PortalCompletedProjectsWidgetProps = {
  content: PortalDashboardDictionary["widgets"]["completedProjects"];
  projects: readonly PortalCompletedProjectDto[];
};

/** Past work stays folded away so current projects keep the attention. */
export function PortalCompletedProjectsWidget({
  content,
  projects,
}: PortalCompletedProjectsWidgetProps) {
  return (
    <Widget
      closeLabel={content.close}
      count={projects.length}
      expandedContent={
        <ul className={styles.list}>
          {projects.map((project) => (
            <li className={styles.item} key={project.id}>
              <span className={styles.title}>{project.title}</span>
              {project.previewUrl ? (
                <a
                  aria-label={formatMessage(content.visitLabel, {
                    name: project.title,
                  })}
                  className={styles.visit}
                  href={project.previewUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {content.visit}
                  <FontAwesomeIcon
                    aria-hidden="true"
                    icon={faArrowUpRightFromSquare}
                  />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      }
      icon={faFlagCheckered}
      openLabel={content.open}
      openMode={WidgetOpenMode.Expand}
      title={content.title}
    >
      <p className={styles.summary}>
        {projects.map((project) => project.title).join(", ")}
      </p>
    </Widget>
  );
}
