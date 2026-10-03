import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import type { CreateProjectRequestDto } from "@invessiv/common/contracts/crm/create-project-request.dto";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { UpdateProjectRequestDto } from "@invessiv/common/contracts/crm/update-project-request.dto";
import type { ProjectFormValues } from "@/common/contracts/crm/project-form-values";
import type { ProjectProcessPlan } from "@/common/contracts/crm/project-process-plan";

/** The project editor validates required fields before sending a request. */
export function validateProjectForm(values: ProjectFormValues) {
  return values.title.trim() ? {} : { title: true };
}

export function createProjectFormValues(
  project: ProjectDto | null,
  defaultPlan: ProjectProcessPlan,
  nextCurrentStep?: string,
): ProjectFormValues {
  const plan: ProjectProcessPlan = project
    ? {
        steps: project.processSteps,
        feedbackRoundPositions: project.feedbackRoundPositions,
        currentProcessStep: project.currentProcessStep,
      }
    : defaultPlan;
  return {
    title: project?.title ?? "",
    status: project?.status ?? ProjectStatus.Planned,
    plan: {
      ...plan,
      currentProcessStep: nextCurrentStep ?? plan.currentProcessStep,
    },
  };
}

/** Fields the dialog does not edit are carried over from the stored project, including its phase. */
function toProjectRequest(
  values: ProjectFormValues,
  stored: ProjectDto | null,
): CreateProjectRequestDto {
  return {
    title: values.title.trim(),
    status: values.status,
    phase: stored?.phase ?? ProjectPhase.Onboarding,
    processSteps: values.plan.steps.map((step) => step.trim()),
    currentProcessStep: values.plan.currentProcessStep.trim(),
    billingModel: stored?.billingModel ?? ProjectBillingModel.FixedPrice,
    feedbackRoundPositions: values.plan.feedbackRoundPositions,
    previewUrl: stored?.previewUrl ?? null,
    nextStepLabel: stored?.nextStepLabel ?? null,
    nextStepDueOn: stored?.nextStepDueOn ?? null,
    startedOn: stored?.startedOn ?? null,
    budgetCents: stored?.budgetCents ?? null,
    hourlyRateCents: stored?.hourlyRateCents ?? null,
  };
}

export function toCreateProjectRequest(
  values: ProjectFormValues,
): CreateProjectRequestDto {
  return toProjectRequest(values, null);
}

export function toUpdateProjectRequest(
  values: ProjectFormValues,
  stored: ProjectDto,
): UpdateProjectRequestDto {
  return { ...toProjectRequest(values, stored), version: stored.version };
}
