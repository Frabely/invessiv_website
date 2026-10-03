import "server-only";

import { and, eq } from "drizzle-orm";

import { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { onboardingGroupEntries } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import type {
  OnboardingAnswerSlot,
  OnboardingFormRow,
  OnboardingGroupEntryRow,
} from "@/server/shared/services/onboarding/onboarding-form-types";
import { onboardingGroupEntryService } from "@/server/shared/services/onboarding/onboarding-group-entry-service";
import { portalOnboardingAccessService as access } from "./portal-onboarding-access-service";
import { portalOnboardingSchemas } from "./portal-onboarding-schemas";

/**
 * The field of a slot the actor may write right now. A field of another form is `not_found`, a
 * block that is not open for the customer `locked`. A sub-field needs an entry of its own group
 * in this form, a block-level field none.
 */
async function findWritableField(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  form: OnboardingFormRow,
  slot: OnboardingAnswerSlot,
): Promise<PortalOnboardingResult<QuestionnaireFieldDto>> {
  const field = await onboardingFormReadService.findField(
    tx,
    form.id,
    slot.fieldId,
  );
  if (!field) return access.notFound();
  const editable = await access.listEditableBlockIds(tx, actor, form);
  if (!editable.includes(field.blockId))
    return { ok: false, code: PortalOnboardingErrorCode.Locked };

  if ((field.parentFieldId === null) !== (slot.groupEntryId === null))
    return access.validation();
  if (slot.groupEntryId !== null && field.parentFieldId !== null) {
    const [entry] = await tx
      .select({ id: onboardingGroupEntries.id })
      .from(onboardingGroupEntries)
      .where(
        and(
          eq(onboardingGroupEntries.id, slot.groupEntryId),
          eq(onboardingGroupEntries.form_id, form.id),
          eq(onboardingGroupEntries.field_id, field.parentFieldId),
        ),
      )
      .limit(1);
    if (!entry) return access.validation();
  }
  return { ok: true, value: field };
}

/**
 * A group entry of this form whose block the actor may write right now. An entry of another form
 * is `not_found`, a block that is not open for the customer `locked`.
 */
async function findWritableGroupEntry(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  form: OnboardingFormRow,
  entryId: string,
): Promise<PortalOnboardingResult<OnboardingGroupEntryRow>> {
  const id = portalOnboardingSchemas.id.safeParse(entryId);
  const entry = id.success
    ? await onboardingGroupEntryService.find(tx, id.data)
    : null;
  if (!entry || entry.form_id !== form.id) return access.notFound();
  const field = await findWritableField(tx, actor, form, {
    formId: form.id,
    fieldId: entry.field_id,
    groupEntryId: null,
  });
  return field.ok ? { ok: true, value: entry } : field;
}

export const portalOnboardingWriteGuardService = {
  findWritableField,
  findWritableGroupEntry,
} as const;
