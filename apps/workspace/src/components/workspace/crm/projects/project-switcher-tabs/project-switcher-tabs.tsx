"use client";

import { type KeyboardEvent, useId, useRef } from "react";

import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import type { CrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./project-switcher-tabs.module.css";

type ProjectSwitcherTabsProps = {
  activeProjectId: string | null;
  onSelectAction: (projectId: string) => void;
  panelId: string;
  projects: readonly CockpitProjectDto[];
  statusLabels: CrmCockpitDictionary["projects"]["status"];
  tabIdFor: (projectId: string) => string;
  tabsLabel: string;
};

export function ProjectSwitcherTabs({
  activeProjectId,
  onSelectAction,
  panelId,
  projects,
  statusLabels,
  tabIdFor,
  tabsLabel,
}: ProjectSwitcherTabsProps) {
  const statusIdPrefix = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(
    0,
    projects.findIndex((project) => project.id === activeProjectId),
  );

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const last = projects.length - 1;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight")
      nextIndex = activeIndex === last ? 0 : activeIndex + 1;
    if (event.key === "ArrowLeft")
      nextIndex = activeIndex === 0 ? last : activeIndex - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = last;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = projects[nextIndex];
    if (!next) return;
    onSelectAction(next.id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <>
      <div aria-label={tabsLabel} className={styles.tabs} role="tablist">
        {projects.map((project, index) => {
          const selected = index === activeIndex;
          const status = project.project?.status;
          return (
            <button
              aria-controls={panelId}
              aria-describedby={
                status ? `${statusIdPrefix}-${project.id}` : undefined
              }
              aria-selected={selected}
              className={styles.tab}
              id={tabIdFor(project.id)}
              key={project.id}
              onClick={() => onSelectAction(project.id)}
              onKeyDown={handleKeyDown}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              role="tab"
              tabIndex={selected ? 0 : -1}
              title={
                status
                  ? `${project.title} (${statusLabels[status]})`
                  : project.title
              }
              type="button"
            >
              {status ? (
                <span
                  aria-hidden="true"
                  className={styles.statusDot}
                  data-status={status}
                />
              ) : null}
              <span className={styles.title}>{project.title}</span>
            </button>
          );
        })}
      </div>
      {/* Kept outside the tab so the accessible name stays exactly the project title. */}
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
