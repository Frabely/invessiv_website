import "server-only";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { StartProjectOnboardingRequestDto } from "@invessiv/common/contracts/crm/onboarding/start-project-onboarding-request.dto";
import { isOnboardingProjectEligible } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { ONBOARDING_FORM_ACTIVITY_ENTITY } from "@/common/constants/crm/onboarding-form-activity-metadata";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { activityService } from "@/server/shared/services/activity-service";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { onboardingFormAccessService } from "@/server/workspace/crm/services/onboarding/onboarding-form-access-service";
import { onboardingFormCreateService } from "@/server/workspace/crm/services/onboarding/onboarding-form-create-service";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";

const PROJECT_NOT_FOUND = {
  ok: false,
  code: OnboardingErrorCode.ProjectNotFound,
} as const;

/**
 * Starts the one onboarding form of a project as a draft: block copies of the template, the
 * pre-fill and the activity in one transaction under the project lock. The unique index on the
 * project stays the last line of defence; the check here gives the friendly answer.
 */
export async function startProjectOnboarding(
  projectId: string,
  input: StartProjectOnboardingRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<OnboardingFormDto>> {
  if (!onboardingFormSchemas.entityId.safeParse(projectId).success)
    return PROJECT_NOT_FOUND;
  const parsed = onboardingFormSchemas.start.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      code: OnboardingErrorCode.ValidationError,
      errors: parsed.error.issues,
    };

  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const project = await onboardingFormAccessService.lockWritableProject(
      tx,
      projectId,
      actor,
    );
    if (!project) return PROJECT_NOT_FOUND;
    if (!isOnboardingProjectEligible(project.status))
      return { ok: false, code: OnboardingErrorCode.ProjectNotEligible };
    if (await onboardingFormAccessService.findFormOfProject(tx, project.id))
      return { ok: false, code: OnboardingErrorCode.FormExists };

    const form = await onboardingFormCreateService.createForm(tx, {
      project,
      templateId: parsed.data.templateId,
      actor,
    });
    if (!form)
      return { ok: false, code: QuestionnaireErrorCode.TemplateNotFound };

    await activityService.createActivity(tx, {
      customerId: form.customer_id,
      projectId: form.project_id,
      type: ActivityType.Created,
      metadata: {
        entity: ONBOARDING_FORM_ACTIVITY_ENTITY,
        onboarding_form_id: form.id,
      },
      actor: { type: ActorType.User, userId: actor.userId },
    });
    return {
      ok: true,
      value: await onboardingFormReadService.toFormDto(
        tx,
        form,
        fileAccessService.readableCondition(actor),
      ),
    };
  });
}
