"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import {
  PROJECT_PHASE_SEQUENCE,
  ProjectPhase,
} from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import {
  ButtonControl,
  Dialog,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { projectsApiService } from "@/client/crm/projects-api-service";
import type { ProjectLineItemsViewModel } from "@/common/contracts/crm/project-line-items-view-model";
import type { Locale } from "@/config/i18n";
import type {
  CrmCockpitDictionary,
  CrmProjectLineItemsDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { OwnerWithoutAccessBadge } from "@/components/workspace/crm/shared/owner-without-access-badge/owner-without-access-badge";
import { ProjectLineItemsSection } from "@/components/workspace/crm/projects/project-line-items-section/project-line-items-section";
import styles from "./customer-projects-section.module.css";

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
}: CustomerProjectsSectionProps) {
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectDto | null>(null);
  const [title, setTitle] = useState("");
  const defaultProcessSteps = PROJECT_PHASE_SEQUENCE.map(
    (value) => content.projects.phases[value],
  );
  const [processSteps, setProcessSteps] = useState(defaultProcessSteps);
  const [currentProcessStep, setCurrentProcessStep] = useState(
    defaultProcessSteps[0],
  );
  const [newProcessStep, setNewProcessStep] = useState("");
  const [status, setStatus] = useState<ProjectDto["status"]>(
    ProjectStatus.Planned,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id ?? null,
  );
  const activeProject =
    projects.find((project) => project.id === selectedProjectId) ??
    projects[0] ??
    null;
  const activeProjectDetails = activeProject?.project ?? null;
  const currentStepRef = useRef<HTMLLIElement>(null);
  const activeOwner = accessMembers?.find(
    (member) => member.id === activeProjectDetails?.ownerMemberId,
  );

  useEffect(() => {
    currentStepRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeProjectDetails?.id, activeProjectDetails?.currentProcessStep]);

  function openEditor(project: ProjectDto | null, nextCurrentStep?: string) {
    setEditing(project);
    setTitle(project?.title ?? "");
    const steps = project?.processSteps ?? defaultProcessSteps;
    setProcessSteps(steps);
    setCurrentProcessStep(
      nextCurrentStep ?? project?.currentProcessStep ?? steps[0],
    );
    setStatus(project?.status ?? ProjectStatus.Planned);
    setEditorOpen(true);
  }

  async function saveProject() {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(false);
    const request = {
      title,
      status,
      phase: ProjectPhase.Onboarding,
      processSteps,
      currentProcessStep,
      billingModel: editing?.billingModel ?? ProjectBillingModel.FixedPrice,
      previewUrl: editing?.previewUrl ?? null,
      nextStepLabel: editing?.nextStepLabel ?? null,
      nextStepDueOn: editing?.nextStepDueOn ?? null,
      startedOn: editing?.startedOn ?? null,
      budgetCents: editing?.budgetCents ?? null,
      hourlyRateCents: editing?.hourlyRateCents ?? null,
      ...(editing ? { version: editing.version } : {}),
    };
    const succeeded = editing
      ? await projectsApiService.updateProject(editing.id, {
          ...request,
          version: editing.version,
        })
      : await projectsApiService.createProject(customerId, request);

    if (succeeded) {
      setEditorOpen(false);
      router.refresh();
      return;
    }

    setError(true);
    setBusy(false);
  }

  function updateProcessStep(index: number, value: string) {
    const next = processSteps.map((step, stepIndex) =>
      stepIndex === index ? value : step,
    );
    if (processSteps[index] === currentProcessStep)
      setCurrentProcessStep(value);
    setProcessSteps(next);
  }

  function removeProcessStep(index: number) {
    if (processSteps.length === 1) return;
    const next = processSteps.filter((_, stepIndex) => stepIndex !== index);
    if (processSteps[index] === currentProcessStep)
      setCurrentProcessStep(next[0]);
    setProcessSteps(next);
  }

  function addProcessStep() {
    const step = newProcessStep.trim();
    if (!step) return;
    setProcessSteps((current) => [...current, step]);
    setNewProcessStep("");
  }

  return (
    <section aria-labelledby="cockpit-projects" className={styles.projects}>
      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.titleRow}>
            <h3 id="cockpit-projects">{content.sections.projects}</h3>
            {canWrite ? (
              <PrimaryCtaButton
                aria-label={content.projects.create}
                onClick={() => openEditor(null)}
                title={content.projects.create}
                type="button"
              >
                +
              </PrimaryCtaButton>
            ) : null}
          </div>
          {projects.length === 0 ? (
            <p className={styles.empty}>{content.projects.empty}</p>
          ) : (
            <div className={styles.switcher} role="tablist">
              {projects.map((project) => (
                <div className={styles.projectSwitchRow} key={project.id}>
                  <button
                    aria-selected={activeProject?.id === project.id}
                    className={styles.projectSwitch}
                    onClick={() => setSelectedProjectId(project.id)}
                    role="tab"
                    type="button"
                  >
                    <span>{project.title}</span>
                    {project.project ? (
                      <small>
                        {content.projects.status[project.project.status]}
                      </small>
                    ) : null}
                  </button>
                  {canWrite && project.project ? (
                    <ButtonControl
                      aria-label={content.projects.edit}
                      className={styles.projectEdit}
                      onClick={() => openEditor(project.project)}
                      title={content.projects.edit}
                      type="button"
                      variant="ghost"
                    >
                      ↗
                    </ButtonControl>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </aside>
        <main className={styles.projectCanvas}>
          {activeProject ? (
            <>
              <div className={styles.projectHeader}>
                <div>
                  {activeProjectDetails ? (
                    <p className={styles.eyebrow}>
                      {content.projects.status[activeProjectDetails.status]}
                    </p>
                  ) : null}
                  <h2>{activeProject.title}</h2>
                </div>
                {activeOwner ? (
                  <div className={styles.ownerBlock}>
                    <span>{content.projects.owner}</span>
                    <strong>{activeOwner.displayName}</strong>
                    {activeProjectDetails &&
                    ownerHasAccess?.[activeProject.id] === false &&
                    onGrantAccessAction ? (
                      <OwnerWithoutAccessBadge
                        content={content.ownerAccess}
                        onGrantAccessAction={
                          activeOwner.active
                            ? () =>
                                onGrantAccessAction(
                                  activeProjectDetails.ownerMemberId,
                                )
                            : undefined
                        }
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
              {activeProjectDetails ? (
                <ol
                  aria-label={content.projects.phase}
                  className={styles.phaseScale}
                >
                  {activeProjectDetails.processSteps.map((item, index) => {
                    const currentIndex =
                      activeProjectDetails.processSteps.indexOf(
                        activeProjectDetails.currentProcessStep,
                      );
                    const state =
                      index < currentIndex
                        ? "complete"
                        : index === currentIndex
                          ? "current"
                          : "upcoming";
                    return (
                      <li
                        data-state={state}
                        key={`${item}-${index}`}
                        ref={state === "current" ? currentStepRef : undefined}
                      >
                        {canWrite ? (
                          <button
                            aria-current={
                              state === "current" ? "step" : undefined
                            }
                            className={styles.phaseButton}
                            onClick={() =>
                              openEditor(activeProjectDetails, item)
                            }
                            type="button"
                          >
                            <span
                              aria-hidden="true"
                              className={styles.phaseDot}
                            />
                            <span>{item}</span>
                          </button>
                        ) : (
                          <>
                            <span
                              aria-hidden="true"
                              className={styles.phaseDot}
                            />
                            <span>{item}</span>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ol>
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
                  key={activeProject.id}
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
              <div className={styles.areaPreview}>
                <section>
                  <h3>{content.projects.areas.tasks}</h3>
                  <p>{content.projects.comingSoon}</p>
                </section>
                <section>
                  <h3>{content.projects.areas.chat}</h3>
                  <p>{content.projects.comingSoon}</p>
                </section>
              </div>
            </>
          ) : (
            <p className={styles.empty}>{content.projects.empty}</p>
          )}
        </main>
      </div>
      {editorOpen ? (
        <Dialog
          closeLabel={content.projects.cancel}
          description={content.projects.formDescription}
          footer={
            <>
              <ButtonControl
                onClick={() => setEditorOpen(false)}
                type="button"
                variant="ghost"
              >
                {content.projects.cancel}
              </ButtonControl>
              <PrimaryCtaButton
                disabled={busy}
                onClick={saveProject}
                type="button"
              >
                {content.projects.save}
              </PrimaryCtaButton>
            </>
          }
          onCloseAction={() => setEditorOpen(false)}
          size="narrow"
          title={
            editing
              ? content.projects.formTitleEdit
              : content.projects.formTitleCreate
          }
        >
          <div className={styles.form}>
            <FormField
              kind="text"
              label={content.projects.title}
              inputProps={{
                autoFocus: true,
                onChange: (event) => setTitle(event.target.value),
                required: true,
                value: title,
              }}
            />
            <label className={styles.selectLabel}>
              {content.projects.statusLabel}
              <select
                onChange={(event) =>
                  setStatus(event.target.value as ProjectDto["status"])
                }
                value={status}
              >
                {Object.entries(content.projects.status).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className={styles.selectLabel}>
              {content.projects.processSteps}
              <span className={styles.processStepList}>
                {processSteps.map((step, index) => (
                  <span
                    className={styles.processStepRow}
                    key={`${step}-${index}`}
                  >
                    <input
                      aria-label={`${content.projects.processSteps} ${index + 1}`}
                      onChange={(event) =>
                        updateProcessStep(index, event.target.value)
                      }
                      value={step}
                    />
                    <ButtonControl
                      aria-label={content.projects.removeProcessStep}
                      disabled={processSteps.length === 1}
                      onClick={() => removeProcessStep(index)}
                      title={content.projects.removeProcessStep}
                      type="button"
                      variant="ghost"
                    >
                      ×
                    </ButtonControl>
                  </span>
                ))}
              </span>
              <span className={styles.addStepRow}>
                <input
                  onChange={(event) => setNewProcessStep(event.target.value)}
                  placeholder={content.projects.processStepPlaceholder}
                  value={newProcessStep}
                />
                <ButtonControl
                  onClick={addProcessStep}
                  type="button"
                  variant="ghost"
                >
                  {content.projects.addProcessStep}
                </ButtonControl>
              </span>
              <small>{content.projects.processStepsHint}</small>
            </label>
            <label className={styles.selectLabel}>
              {content.projects.currentProcessStep}
              <select
                onChange={(event) => setCurrentProcessStep(event.target.value)}
                value={currentProcessStep}
              >
                {processSteps.map((step, index) => (
                  <option key={`${step}-${index}`} value={step}>
                    {step}
                  </option>
                ))}
              </select>
            </label>
            {error ? (
              <p className={styles.error} role="alert">
                {content.projects.saveError}
              </p>
            ) : null}
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}
