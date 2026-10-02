import "server-only";

import { eq } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { OnboardingTransitionSide } from "@invessiv/common/constants/crm/onboarding/onboarding-transition-sides";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CompleteOnboardingFormRequestDto } from "@invessiv/common/contracts/crm/onboarding/complete-onboarding-form-request.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import {
  canTransitionOnboardingForm,
  isOnboardingCallDateAcceptable,
} from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { businessToday } from "@/common/patterns/time/business-today";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import { onboardingFormTransitionService } from "@/server/shared/services/onboarding/onboarding-form-transition-service";
import type { OnboardingFormRow } from "@/server/shared/services/onboarding/onboarding-form-types";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { onboardingFormAccessService } from "@/server/workspace/crm/services/onboarding/onboarding-form-access-service";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";

const FORM_NOT_FOUND = {
  ok: false,
  code: OnboardingErrorCode.FormNotFound,
} as const;

/**
 * Completes a submitted form under the form lock. Two things must hold: no visible required
 * answer is missing, computed with the same function the portal submits with, and the call took
 * place. Unreviewed blocks and questions kept for the call do not block; their state stays as
 * history. Snapshot, status, task, phase, activity and chat notice succeed or fail together.
 */
export async function completeOnboardingForm(
  formId: string,
  input: CompleteOnboardingFormRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<OnboardingFormDto>> {
  if (!onboardingFormSchemas.entityId.safeParse(formId).success)
    return FORM_NOT_FOUND;
  const parsed = onboardingFormSchemas.complete.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      code: OnboardingErrorCode.ValidationError,
      errors: parsed.error.issues,
    };
  const { expectedVersion, callHeldOn, advancePhase } = parsed.data;

  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const form = await onboardingFormAccessService.lockWritableForm(
      tx,
      formId,
      actor,
    );
    if (!form) return FORM_NOT_FOUND;
    // Checked before the version: a completed form stays so whatever the client read.
    if (
      !canTransitionOnboardingForm(
        form.status,
        OnboardingFormStatus.Completed,
        OnboardingTransitionSide.Internal,
      )
    )
      return { ok: false, code: OnboardingErrorCode.InvalidTransition };

    const toDto = (row: OnboardingFormRow) =>
      onboardingFormReadService.toFormDto(
        tx,
        row,
        fileAccessService.readableCondition(actor),
      );
    if (form.version !== expectedVersion)
      return {
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          code: ConcurrencyErrorCode.VersionConflict,
          currentVersion: form.version,
          current: await toDto(form),
        },
      };

    if (!isOnboardingCallDateAcceptable(callHeldOn, businessToday()))
      return { ok: false, code: OnboardingErrorCode.CallDateRequired };
    const { missing } = await onboardingFormReadService.toCompleteness(
      tx,
      form,
    );
    if (missing.length > 0)
      return {
        ok: false,
        code: OnboardingErrorCode.RequiredMissing,
        missing: [...missing],
      };

    const [project] = await tx
      .select({ title: projects.title })
      .from(projects)
      .where(eq(projects.id, form.project_id))
      .limit(1);
    if (!project) throw new Error("Onboarding form without its project");

    const completed = await onboardingFormTransitionService.complete(tx, form, {
      actor: { type: ActorType.User, userId: actor.userId },
      memberId: actor.workspaceMemberId,
      projectTitle: project.title,
      callHeldOn,
      advancePhase,
    });
    return { ok: true, value: await toDto(completed) };
  });
}
