"use client";

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useId, useRef, useState } from "react";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import { Dialog, DialogSize, SecondaryCtaButton, TabList } from "@invessiv/ui";
import { PortalHoursTab } from "@/common/constants/portal/portal-hours-tabs";
import { PortalHoursFocusTarget } from "@/common/constants/portal/portal-hours-focus-targets";
import { portalHoursView } from "@/common/patterns/portal/portal-hours-view";
import type { Locale } from "@/config/i18n";
import { usePortalHoursProject } from "@/hooks/portal/use-portal-hours-project";
import type { PortalHoursDictionary } from "@/i18n/dictionaries/portal";
import { PortalHoursFigures } from "../portal-hours-figures/portal-hours-figures";
import { PortalHoursProjects } from "../portal-hours-projects/portal-hours-projects";
import { PortalHoursPurchases } from "../portal-hours-purchases/portal-hours-purchases";
import { PortalTimeEntryList } from "../portal-time-entry-list/portal-time-entry-list";
import styles from "./portal-hours-dialog.module.css";

export type PortalHoursDialogProps = {
  content: PortalHoursDictionary;
  customerId: string;
  /** The dashboard's project; the dialog opens on it when it is visible and the URL names none. */
  dashboardProjectId: string | null;
  /** Balance, projects and purchases as the dashboard already loaded them. */
  hours: PortalHoursDto;
  locale: Locale;
  onCloseAction: () => void;
};

/**
 * The company's hours as a dialog of the dashboard; there is no page of its own. The overview
 * shows the company's figures, the projects and the tabs for entries and purchases; a project row
 * opens that project with its own figures and entries. Purchases belong to the company and stay
 * in the overview. Without the detail right there are no entries at all: no hint, no request. The
 * portal never writes hours, so there is no owner notice either.
 */
export function PortalHoursDialog({
  content,
  customerId,
  dashboardProjectId,
  hours,
  locale,
  onCloseAction,
}: PortalHoursDialogProps) {
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const entriesHeadingId = `${baseId}-entries`;
  const { projectId, selectProject } = usePortalHoursProject(
    hours.projects.map((project) => project.projectId),
    dashboardProjectId,
  );
  const project =
    hours.projects.find((candidate) => candidate.projectId === projectId) ??
    null;
  const tabs = portalHoursView.tabsFor(hours.canReadEntries);
  const [chosenTab, setChosenTab] = useState<PortalHoursTab | null>(null);
  const tab =
    chosenTab && tabs.includes(chosenTab)
      ? chosenTab
      : (tabs[0] ?? PortalHoursTab.Purchases);
  const [returnProjectId, setReturnProjectId] = useState<string | null>(null);
  const pendingFocus = useRef<PortalHoursFocusTarget | null>(null);
  const projectHeadingRef = useRef<HTMLHeadingElement>(null);
  const returnRowRef = useRef<HTMLButtonElement>(null);

  // Only a click moves focus; opening the dialog on a project leaves it where the dialog puts it.
  useEffect(() => {
    if (pendingFocus.current === PortalHoursFocusTarget.Project)
      projectHeadingRef.current?.focus();
    if (pendingFocus.current === PortalHoursFocusTarget.Overview)
      returnRowRef.current?.focus();
    pendingFocus.current = null;
  }, [projectId]);

  function openProject(next: string) {
    pendingFocus.current = PortalHoursFocusTarget.Project;
    selectProject(next);
  }

  function showOverview() {
    pendingFocus.current = PortalHoursFocusTarget.Overview;
    setReturnProjectId(projectId);
    selectProject(null);
  }

  return (
    <Dialog
      closeLabel={content.dialog.close}
      description={content.dialog.intro}
      onCloseAction={onCloseAction}
      size={DialogSize.Wide}
      title={content.dialog.title}
    >
      {project ? (
        <div className={styles.body}>
          <div className={styles.projectHead}>
            <SecondaryCtaButton onClick={showOverview} type="button">
              <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
              {content.projects.back}
            </SecondaryCtaButton>
            <h3
              className={styles.projectTitle}
              ref={projectHeadingRef}
              tabIndex={-1}
            >
              {project.title}
            </h3>
          </div>
          <PortalHoursFigures
            content={content.figures}
            hours={hours}
            project={project}
          />
          {hours.canReadEntries ? (
            <section
              aria-labelledby={entriesHeadingId}
              className={styles.sections}
            >
              <h3 className={styles.sectionHeading} id={entriesHeadingId}>
                {content.tabs.entries}
              </h3>
              <PortalTimeEntryList
                content={content.entries}
                customerId={customerId}
                locale={locale}
                projectId={project.projectId}
                projects={hours.projects}
              />
            </section>
          ) : null}
        </div>
      ) : (
        <div className={styles.body}>
          <PortalHoursFigures
            content={content.figures}
            hours={hours}
            project={null}
          />
          {hours.projects.length > 0 || hours.earlierProjects ? (
            <PortalHoursProjects
              content={content.projects}
              earlierProjects={hours.earlierProjects}
              projects={hours.projects}
              returnProjectId={returnProjectId}
              returnRowRef={returnRowRef}
              onSelectProjectAction={openProject}
            />
          ) : null}
          <div className={styles.sections}>
            {tabs.length > 1 ? (
              <TabList
                activeValue={tab}
                ariaLabel={content.tabs.label}
                items={tabs.map((value) => ({
                  value,
                  id: `${baseId}-${value}`,
                  panelId,
                  label: content.tabs[value],
                }))}
                onSelectAction={setChosenTab}
              />
            ) : null}
            <div
              aria-label={tabs.length > 1 ? undefined : content.tabs[tab]}
              aria-labelledby={tabs.length > 1 ? `${baseId}-${tab}` : undefined}
              className={styles.panel}
              id={panelId}
              role={tabs.length > 1 ? "tabpanel" : "region"}
            >
              {tab === PortalHoursTab.Entries ? (
                <PortalTimeEntryList
                  content={content.entries}
                  customerId={customerId}
                  locale={locale}
                  projectId={null}
                  projects={hours.projects}
                />
              ) : (
                <PortalHoursPurchases
                  content={content.purchases}
                  locale={locale}
                  purchases={hours.purchases}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
