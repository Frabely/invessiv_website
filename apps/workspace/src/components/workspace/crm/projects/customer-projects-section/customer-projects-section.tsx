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
  CrmFeedbackRoundsDictionary,
  CrmFilesDictionary,
  CrmHoursDictionary,
  CrmOnboardingDictionary,
  CrmProjectLineItemsDictionary,
  CrmQuestionnaireDictionary,
  CrmTasksDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import type { OnboardingViewModel } from "@/common/contracts/crm/onboarding/onboarding-view-model";
import { ProjectOnboardingSection } from "@/components/workspace/crm/onboarding/project/project-onboarding-section/project-onboarding-section";
import type { FeedbackRoundsViewModel } from "@/common/contracts/crm/feedback-rounds-view-model";
import { ProjectFeedbackSection } from "@/components/workspace/crm/feedback-rounds/project-feedback-section/project-feedback-section";
import { useCockpitSelection } from "@/hooks/workspace/crm/use-cockpit-selection";
import { ProjectEditorDialog } from "@/components/workspace/crm/projects/project-editor-dialog/project-editor-dialog";
import { ProjectOverview } from "@/components/workspace/crm/projects/project-overview/project-overview";
import { ProjectSwitcherTabs } from "@/components/workspace/crm/projects/project-switcher-tabs/project-switcher-tabs";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ProjectLineItemsSection } from "@/components/workspace/crm/projects/project-line-items-section/project-line-items-section";
import { ProjectTasksSection } from "@/components/workspace/crm/tasks/project-tasks-section/project-tasks-section";
import { CustomerFilesSection } from "@/components/workspace/crm/files/customer-files-section/customer-files-section";
import type { FilesViewModel } from "@/common/contracts/crm/files/files-view-model";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import type { HoursViewModel } from "@/common/contracts/crm/hours/hours-view-model";
import { ProjectHoursSection } from "@/components/workspace/crm/hours/project-hours-section/project-hours-section";
import { TimeEntryFormDialog } from "@/components/workspace/crm/hours/time-entry-form-dialog/time-entry-form-dialog";
import styles from "./customer-projects-section.module.css";

type EditorState = {
  project: ProjectDto | null;
  nextCurrentStep?: string;
  key: number;
};

/** The one booking dialog of the canvas: opened from the hours section or from a task row. */
type TimeEntryDialogState = {
  entry: TimeEntryDto | null;
  taskId: string | null;
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
  /** Absent without `hours.read` anywhere on the customer; a project outside its list shows no hours. */
  hours?: HoursViewModel;
  hoursContent?: CrmHoursDictionary;
  /** Project tab from the URL; an unknown or foreign id falls back to the first project. */
  selectedProjectId?: string | null;
  /** Rounds of the open tab; absent without `projects.read` there, the section then does not exist. */
  feedback?: FeedbackRoundsViewModel;
  feedbackContent?: CrmFeedbackRoundsDictionary;
  /** Onboarding of the open tab; absent without `projects.read` there, the section then does not exist. */
  onboarding?: OnboardingViewModel;
  onboardingContent?: CrmOnboardingDictionary;
  /** Error texts of the questionnaire kit, which a start of an onboarding can answer with. */
  questionnaireErrors?: CrmQuestionnaireDictionary["errors"];
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
  hours,
  hoursContent,
  selectedProjectId: requestedProjectId = null,
  feedback,
  feedbackContent,
  onboarding,
  onboardingContent,
  questionnaireErrors,
}: CustomerProjectsSectionProps) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [timeEntryDialog, setTimeEntryDialog] =
    useState<TimeEntryDialogState | null>(null);
  const [timeEntriesRevision, setTimeEntriesRevision] = useState(0);
  const selection = useCockpitSelection(customerId);
  const selectedProjectId = requestedProjectId ?? projects[0]?.id ?? null;
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
  // Rounds of a tab that is still loading are never shown under another project.
  const activeFeedback =
    feedback && feedback.projectId === activeProject?.id ? feedback : null;
  const activeOnboarding =
    onboarding && onboarding.projectId === activeProject?.id
      ? onboarding
      : null;

  const activeHoursProject =
    hours && hoursContent && activeProject
      ? (hours.hours.projects.find(
          (project) => project.projectId === activeProject.id,
        ) ?? null)
      : null;
  const canBookTime =
    activeHoursProject !== null &&
    hours !== undefined &&
    hours.writableProjectIds.includes(activeHoursProject.projectId);
  // Null without the right to read tasks there: the dialog then offers no task field.
  const activeTaskOptions =
    tasks &&
    activeProject &&
    tasks.readableProjectIds.includes(activeProject.id)
      ? tasks.tasks
          .filter((task) => task.projectId === activeProject.id)
          .map((task) => ({
            id: task.id,
            title: task.title,
            linkable: task.status !== TaskStatus.Cancelled,
          }))
      : null;

  function openTimeEntryDialog(
    entry: TimeEntryDto | null,
    taskId: string | null = null,
  ) {
    setTimeEntryDialog({
      entry,
      taskId,
      key: (timeEntryDialog?.key ?? 0) + 1,
    });
  }

  function selectProject(projectId: string) {
    selection.select({ projectId });
  }

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
            onSelectAction={selectProject}
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
            roundProgress={activeFeedback?.roundProgress}
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
              hours={
                hours && hoursContent && activeHoursProject
                  ? {
                      bookedMinutesByTaskId: hours.bookedMinutesByTaskId,
                      content: hoursContent.task,
                      onBookTimeAction: canBookTime
                        ? (task) => openTimeEntryDialog(null, task.id)
                        : undefined,
                    }
                  : undefined
              }
            />
          ) : null}
          {hours && hoursContent && activeHoursProject ? (
            <ProjectHoursSection
              canManage={hours.canManage}
              canWrite={canBookTime}
              content={hoursContent}
              customerId={customerId}
              freeMinutes={hours.hours.balance?.freeMinutes ?? null}
              key={`hours-${activeProject.id}`}
              locale={locale}
              onBookAction={() => openTimeEntryDialog(null)}
              onChangedAction={() =>
                setTimeEntriesRevision((current) => current + 1)
              }
              onEditAction={(entry) => openTimeEntryDialog(entry)}
              project={activeHoursProject}
              revision={timeEntriesRevision}
              tasks={activeTaskOptions}
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
          {activeFeedback && feedbackContent && filesContent ? (
            <ProjectFeedbackSection
              content={feedbackContent}
              customerId={customerId}
              filesContent={filesContent}
              key={`feedback-${activeProject.id}`}
              locale={locale}
              viewModel={activeFeedback}
            />
          ) : null}
          {activeOnboarding && onboardingContent && questionnaireErrors ? (
            <ProjectOnboardingSection
              content={onboardingContent}
              key={`onboarding-${activeProject.id}`}
              kitErrors={questionnaireErrors}
              labelCollapse={formatMessage(content.collapse.collapse, {
                section: onboardingContent.project.title,
              })}
              labelExpand={formatMessage(content.collapse.expand, {
                section: onboardingContent.project.title,
              })}
              locale={locale}
              viewModel={activeOnboarding}
            />
          ) : null}
        </div>
      ) : (
        <p className={styles.empty}>{content.projects.empty}</p>
      )}
      {timeEntryDialog && hours && hoursContent && activeHoursProject ? (
        <TimeEntryFormDialog
          content={hoursContent}
          entry={timeEntryDialog.entry}
          initialTaskId={timeEntryDialog.taskId}
          key={`${activeHoursProject.projectId}-${timeEntryDialog.key}`}
          locale={locale}
          onCloseAction={() => setTimeEntryDialog(null)}
          onSavedAction={() => setTimeEntriesRevision((current) => current + 1)}
          project={activeHoursProject}
          projectTitle={activeHoursProject.title}
          tasks={activeTaskOptions}
          today={hours.today}
        />
      ) : null}
      {editor ? (
        <ProjectEditorDialog
          content={content.projects}
          customerId={customerId}
          key={editor.key}
          nextCurrentStep={editor.nextCurrentStep}
          runningFeedbackRound={
            activeFeedback && activeFeedback.projectId === editor.project?.id
              ? activeFeedback.roundProgress.activeRoundNumber
              : null
          }
          onCloseAction={() => setEditor(null)}
          project={editor.project}
        />
      ) : null}
    </section>
  );
}
