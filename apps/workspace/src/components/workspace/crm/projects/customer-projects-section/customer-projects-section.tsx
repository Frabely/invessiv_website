"use client";

import { useId, useState } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { PrimaryCtaButton } from "@invessiv/ui";
import type { ProjectLineItemsViewModel } from "@/common/contracts/crm/project-line-items-view-model";
import type { TasksViewModel } from "@/common/contracts/crm/tasks-view-model";
import type { Locale } from "@/config/i18n";
import type {
  CrmCockpitDictionary,
  CrmFilesDictionary,
  CrmProjectLineItemsDictionary,
  CrmTasksDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { ProjectEditorDialog } from "@/components/workspace/crm/projects/project-editor-dialog/project-editor-dialog";
import { ProjectOverview } from "@/components/workspace/crm/projects/project-overview/project-overview";
import { MockSectionCard } from "@/components/workspace/crm/shared/mock-section-card/mock-section-card";
import { ProjectSwitcherTabs } from "@/components/workspace/crm/projects/project-switcher-tabs/project-switcher-tabs";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ProjectLineItemsSection } from "@/components/workspace/crm/projects/project-line-items-section/project-line-items-section";
import { ProjectTasksSection } from "@/components/workspace/crm/tasks/project-tasks-section/project-tasks-section";
import { CustomerFilesSection } from "@/components/workspace/crm/files/customer-files-section/customer-files-section";
import type { FilesViewModel } from "@/common/contracts/crm/files/files-view-model";
import styles from "./customer-projects-section.module.css";

const PROJECT_FUTURE_AREAS = ["feedback", "onboarding"] as const;

type EditorState = {
  project: ProjectDto | null;
  nextCurrentStep?: string;
  key: number;
};

type CustomerProjectsSectionProps = {
  content: CrmCockpitDictionary;
  customerId: string;
  canWrite: boolean;
  locale: Locale;
  projects: readonly CockpitProjectDto[];
  accessMembers?: readonly WorkspaceMemberDto[];
  ownerHasAccess?: Readonly<Record<string, boolean>>;
  onGrantAccessAction?: (memberId: string) => void;
  /** Absent when the actor may not read project line items anywhere; the area is then not shown. */
  projectLineItems?: ProjectLineItemsViewModel;
  projectLineItemsContent?: CrmProjectLineItemsDictionary;
  /** Absent when the actor may not read tasks anywhere; the area is then not shown. */
  tasks?: TasksViewModel;
  tasksContent?: CrmTasksDictionary;
  /** Absent without `files.read` anywhere; a project outside `read.projectIds` shows no files. */
  files?: FilesViewModel;
  filesContent?: CrmFilesDictionary;
  filesRevision?: number;
  onFilesChangedAction?: () => void;
};

/** Project context rendered inside the existing customer cockpit, not as a second detail view. */
export function CustomerProjectsSection({
  content,
  customerId,
  canWrite,
  locale,
  projects,
  accessMembers,
  ownerHasAccess,
  onGrantAccessAction,
  projectLineItems,
  projectLineItemsContent,
  tasks,
  tasksContent,
  files,
  filesContent,
  filesRevision = 0,
  onFilesChangedAction,
}: CustomerProjectsSectionProps) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id ?? null,
  );
  const activeProject =
    projects.find((project) => project.id === selectedProjectId) ??
    projects[0] ??
    null;
  const activeProjectDetails = activeProject?.project ?? null;
  const headingId = useId();
  const tabIdPrefix = useId();
  const panelId = useId();
  const tabIdFor = (projectId: string) => `${tabIdPrefix}-${projectId}`;
  const activeOwner = accessMembers?.find(
    (member) => member.id === activeProjectDetails?.ownerMemberId,
  );

  function openEditor(project: ProjectDto | null, nextCurrentStep?: string) {
    setEditor({ project, nextCurrentStep, key: (editor?.key ?? 0) + 1 });
  }

  return (
    <section aria-labelledby={headingId} className={styles.projects}>
      <h2 className="sr-only" id={headingId}>
        {content.sections.projects}
      </h2>
      <div className={styles.tabBar}>
        {projects.length > 0 ? (
          <ProjectSwitcherTabs
            activeProjectId={activeProject?.id ?? null}
            onSelectAction={setSelectedProjectId}
            panelId={panelId}
            projects={projects}
            statusLabels={content.projects.status}
            tabIdForAction={tabIdFor}
            tabsLabel={content.projects.tabsLabel}
          />
        ) : null}
        {canWrite ? (
          <PrimaryCtaButton
            className={styles.createButton}
            onClick={() => openEditor(null)}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
            <span>{content.projects.create}</span>
          </PrimaryCtaButton>
        ) : null}
      </div>
      {activeProject ? (
        <div
          aria-labelledby={tabIdFor(activeProject.id)}
          className={styles.projectCanvas}
          id={panelId}
          role="tabpanel"
        >
          <ProjectOverview
            content={content}
            onEditAction={canWrite ? openEditor : undefined}
            onGrantAccessAction={onGrantAccessAction}
            owner={activeOwner}
            ownerWithoutAccess={ownerHasAccess?.[activeProject.id] === false}
            project={activeProjectDetails}
            title={activeProject.title}
          />
          {tasks &&
          tasksContent &&
          tasks.readableProjectIds.includes(activeProject.id) ? (
            <ProjectTasksSection
              canWrite={tasks.writableProjectIds.includes(activeProject.id)}
              content={tasksContent}
              key={`tasks-${activeProject.id}`}
              locale={locale}
              members={tasks.members}
              projectId={activeProject.id}
              tasks={tasks.tasks.filter(
                (task) => task.projectId === activeProject.id,
              )}
              today={tasks.today}
            />
          ) : null}
          {projectLineItems &&
          projectLineItemsContent &&
          projectLineItems.readableProjectIds.includes(activeProject.id) ? (
            <ProjectLineItemsSection
              canWrite={projectLineItems.writableProjectIds.includes(
                activeProject.id,
              )}
              catalogHref={projectLineItems.catalogHref}
              content={projectLineItemsContent}
              key={`line-items-${activeProject.id}`}
              locale={locale}
              projectId={activeProject.id}
              services={projectLineItems.services.filter(
                (service) => service.projectId === activeProject.id,
              )}
              templates={projectLineItems.assignableTemplates}
              value={
                projectLineItems.valuesByProjectId[activeProject.id] ?? {
                  oneTimeCents: 0,
                  monthlyCents: 0,
                }
              }
            />
          ) : null}
          {files &&
          filesContent &&
          files.read.projectIds.includes(activeProject.id) ? (
            <CustomerFilesSection
              content={filesContent}
              customerId={customerId}
              key={`files-${activeProject.id}`}
              locale={locale}
              onChangedAction={onFilesChangedAction ?? (() => undefined)}
              projectId={activeProject.id}
              revision={filesRevision}
              viewModel={files}
            />
          ) : null}
          {PROJECT_FUTURE_AREAS.map((area) => {
            const futureArea = content.projects.futureAreas[area];
            return (
              <MockSectionCard
                badgeLabel={content.mock.badge}
                body={futureArea.body}
                key={area}
                labelCollapse={formatMessage(content.collapse.collapse, {
                  section: futureArea.title,
                })}
                labelExpand={formatMessage(content.collapse.expand, {
                  section: futureArea.title,
                })}
                title={futureArea.title}
              />
            );
          })}
        </div>
      ) : (
        <p className={styles.empty}>{content.projects.empty}</p>
      )}
      {editor ? (
        <ProjectEditorDialog
          content={content.projects}
          customerId={customerId}
          key={editor.key}
          nextCurrentStep={editor.nextCurrentStep}
          onCloseAction={() => setEditor(null)}
          project={editor.project}
        />
      ) : null}
    </section>
  );
}
