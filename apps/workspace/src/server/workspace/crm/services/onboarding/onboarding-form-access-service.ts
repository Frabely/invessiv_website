import "server-only";

import { and, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { isOnboardingStructureEditable } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { onboardingForms, projects } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import type { OnboardingFormRow } from "@/server/shared/services/onboarding/onboarding-form-types";
import type { QuestionnaireReadExecutor } from "@/server/shared/services/questionnaire/questionnaire-definition-types";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import type { OnboardingProjectRef } from "./onboarding-form-access-types";

type ProjectPermission =
  typeof Permission.ProjectsRead | typeof Permission.ProjectsWrite;

/** A form outside the actor's `projects.read` scope behaves like a missing one. */
async function findReadableForm(
  executor: QuestionnaireReadExecutor,
  formId: string,
  actor: WorkspaceActor,
): Promise<OnboardingFormRow | null> {
  const [form] = await executor
    .select()
    .from(onboardingForms)
    .where(
      and(
        eq(onboardingForms.id, formId),
        crmAccessCondition.forScope(
          accessScope(actor, Permission.ProjectsRead),
          {
            customerId: onboardingForms.customer_id,
            projectId: onboardingForms.project_id,
          },
        ),
      ),
    )
    .limit(1);
  return form ?? null;
}

async function findFormOfProject(
  executor: QuestionnaireReadExecutor,
  projectId: string,
): Promise<OnboardingFormRow | null> {
  const [form] = await executor
    .select()
    .from(onboardingForms)
    .where(eq(onboardingForms.project_id, projectId))
    .limit(1);
  return form ?? null;
}

function selectProject(
  executor: QuestionnaireReadExecutor,
  projectId: string,
  actor: WorkspaceActor,
  permission: ProjectPermission,
) {
  return executor
    .select({
      id: projects.id,
      customerId: projects.customer_id,
      status: projects.status,
    })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        crmAccessCondition.forScope(accessScope(actor, permission), {
          customerId: projects.customer_id,
          projectId: projects.id,
        }),
      ),
    )
    .limit(1);
}

async function findReadableProject(
  executor: QuestionnaireReadExecutor,
  projectId: string,
  actor: WorkspaceActor,
): Promise<OnboardingProjectRef | null> {
  const [project] = await selectProject(
    executor,
    projectId,
    actor,
    Permission.ProjectsRead,
  );
  return project ?? null;
}

function canWrite(
  actor: WorkspaceActor,
  target: { customerId: string; projectId: string },
): boolean {
  return canOn(actor, Permission.ProjectsWrite, target);
}

/**
 * Locks the project for a start. The lock is the one the project editor takes, so two parallel
 * starts serialize and the status that decides eligibility cannot change underneath.
 */
async function lockWritableProject(
  tx: ContactDatabaseTransaction,
  projectId: string,
  actor: WorkspaceActor,
): Promise<OnboardingProjectRef | null> {
  const [project] = await selectProject(
    tx,
    projectId,
    actor,
    Permission.ProjectsWrite,
  ).for("update");
  if (
    !project ||
    !canWrite(actor, { customerId: project.customerId, projectId: project.id })
  )
    return null;
  return project;
}

/**
 * Locks a form the actor may write, whatever its status. A form outside the actor's
 * `projects.write` scope behaves like a missing one.
 */
async function lockWritableForm(
  tx: ContactDatabaseTransaction,
  formId: string,
  actor: WorkspaceActor,
): Promise<OnboardingFormRow | null> {
  const [form] = await tx
    .select()
    .from(onboardingForms)
    .where(
      and(
        eq(onboardingForms.id, formId),
        crmAccessCondition.forScope(
          accessScope(actor, Permission.ProjectsWrite),
          {
            customerId: onboardingForms.customer_id,
            projectId: onboardingForms.project_id,
          },
        ),
      ),
    )
    .limit(1)
    .for("update");
  if (
    !form ||
    !canWrite(actor, {
      customerId: form.customer_id,
      projectId: form.project_id,
    })
  )
    return null;
  return form;
}

/**
 * Locks a form for a structure change. Every such write holds this lock, so the status, the block
 * list and the block keys are checked against a stable form. A form the actor may not write
 * behaves like a missing one; a form past its first submission is fixed.
 */
async function lockForStructure(
  tx: ContactDatabaseTransaction,
  formId: string,
  actor: WorkspaceActor,
): Promise<
  | { ok: true; form: OnboardingFormRow }
  | {
      ok: false;
      code:
        | typeof OnboardingErrorCode.FormNotFound
        | typeof OnboardingErrorCode.NotEditable;
    }
> {
  const form = await lockWritableForm(tx, formId, actor);
  if (!form) return { ok: false, code: OnboardingErrorCode.FormNotFound };
  if (!isOnboardingStructureEditable(form.status))
    return { ok: false, code: OnboardingErrorCode.NotEditable };
  return { ok: true, form };
}

export const onboardingFormAccessService = {
  canWrite,
  findFormOfProject,
  findReadableForm,
  findReadableProject,
  lockForStructure,
  lockWritableForm,
  lockWritableProject,
} as const;
