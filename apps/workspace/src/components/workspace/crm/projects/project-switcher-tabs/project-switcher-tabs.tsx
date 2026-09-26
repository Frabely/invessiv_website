"use client";

import { useId } from "react";
import { TabList } from "@invessiv/ui";

import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import type { CrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./project-switcher-tabs.module.css";

type ProjectSwitcherTabsProps = {
  activeProjectId: string | null;
  onSelectAction: (projectId: string) => void;
  panelId: string;
  projects: readonly CockpitProjectDto[];
  statusLabels: CrmCockpitDictionary["projects"]["status"];
  tabIdForAction: (projectId: string) => string;
  tabsLabel: string;
};

export function ProjectSwitcherTabs({
  activeProjectId,
  onSelectAction,
  panelId,
  projects,
  statusLabels,
  tabIdForAction,
  tabsLabel,
}: ProjectSwitcherTabsProps) {
  const statusIdPrefix = useId();
  return (
    <>
      <TabList
        activeValue={activeProjectId ?? projects[0]?.id ?? ""}
        ariaLabel={tabsLabel}
        className={styles.tabs}
        items={projects.map((project) => {
          const status = project.project?.status;
          return {
            value: project.id,
            id: tabIdForAction(project.id),
            panelId,
            accessibleName: project.title,
            descriptionId: status
              ? `${statusIdPrefix}-${project.id}`
              : undefined,
            title: status
              ? `${project.title} (${statusLabels[status]})`
              : project.title,
            label: (
              <>
                {status ? (
                  <span
                    aria-hidden="true"
                    className={styles.statusDot}
                    data-status={status}
                  />
                ) : null}
                <span className={styles.title}>{project.title}</span>
              </>
            ),
          };
        })}
        onSelectAction={onSelectAction}
        tabClassName={styles.tab}
      />
      <div hidden>
        {projects.map((project) =>
          project.project ? (
            <span id={`${statusIdPrefix}-${project.id}`} key={project.id}>
              {statusLabels[project.project.status]}
            </span>
          ) : null,
        )}
      </div>
    </>
  );
}
