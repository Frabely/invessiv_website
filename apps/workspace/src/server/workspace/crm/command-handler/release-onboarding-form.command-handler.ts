import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { OnboardingTransitionSide } from "@invessiv/common/constants/crm/onboarding/onboarding-transition-sides";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { ReleaseOnboardingFormRequestDto } from "@invessiv/common/contracts/crm/onboarding/release-onboarding-form-request.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { canTransitionOnboardingForm } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import {
  isOnboardingFormReleasable,
  listOnboardingReleaseWarnings,
} from "@invessiv/common/patterns/crm/onboarding/onboarding-release-check";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  people,
  portalMemberships,
  projects,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
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

/** Preferred languages of the contacts who can open the customer's portal right now. */
async function listContactLocales(
  tx: ContactDatabaseTransaction,
  customerId: string,
): Promise<Locale[]> {
  const rows = await tx
    .selectDistinct({ locale: people.preferred_locale })
    .from(portalMemberships)
    .innerJoin(people, eq(people.id, portalMemberships.person_id))
    .where(
      and(
        eq(portalMemberships.customer_id, customerId),
        isNull(portalMemberships.revoked_at),
      ),
    );
  return rows.map((row) => row.locale);
}

async function loadProjectTitle(
  tx: ContactDatabaseTransaction,
  form: OnboardingFormRow,
): Promise<string> {
  const [project] = await tx
    .select({ title: projects.title })
    .from(projects)
    .where(eq(projects.id, form.project_id))
    .limit(1);
  if (!project) throw new Error("Onboarding form without its project");
  return project.title;
}

/**
 * Releases a draft to the portal under the form lock. A form that asks nothing is refused; missing
 * texts in a contact's language and a customer without portal contact come back as warnings until
 * the team acknowledges them. The structure stays editable afterwards, the customer then sees
 * every change at once.
 */
export async function releaseOnboardingForm(
  formId: string,
  input: ReleaseOnboardingFormRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<OnboardingFormDto>> {
  if (!onboardingFormSchemas.entityId.safeParse(formId).success)
    return FORM_NOT_FOUND;
  const parsed = onboardingFormSchemas.release.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      code: OnboardingErrorCode.ValidationError,
      errors: parsed.error.issues,
    };

  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const form = await onboardingFormAccessService.lockWritableForm(
      tx,
      formId,
      actor,
    );
    if (!form) return FORM_NOT_FOUND;
    // Checked before the version: a form that is already released stays so whatever the client read.
    if (
      !canTransitionOnboardingForm(
        form.status,
        OnboardingFormStatus.Open,
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
    const current = await toDto(form);
    if (form.version !== parsed.data.expectedVersion)
      return {
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          code: ConcurrencyErrorCode.VersionConflict,
          currentVersion: form.version,
          current,
        },
      };

    const blocks = current.blocks.map((step) => step.block);
    if (!isOnboardingFormReleasable(blocks))
      return { ok: false, code: QuestionnaireErrorCode.InvalidFieldConfig };
    if (!parsed.data.acknowledgeWarnings) {
      const warnings = listOnboardingReleaseWarnings(
        blocks,
        await listContactLocales(tx, form.customer_id),
      );
      if (warnings.length > 0)
        return {
          ok: false,
          code: OnboardingErrorCode.ReleaseWarnings,
          warnings,
        };
    }

    const released = await onboardingFormTransitionService.release(tx, form, {
      actor: { type: ActorType.User, userId: actor.userId },
      memberId: actor.workspaceMemberId,
      projectTitle: await loadProjectTitle(tx, form),
    });
    return { ok: true, value: await toDto(released) };
  });
}
