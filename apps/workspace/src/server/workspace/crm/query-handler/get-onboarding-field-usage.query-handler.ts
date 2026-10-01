import "server-only";

import { and, count, eq, inArray, or } from "drizzle-orm";

import type { OnboardingFieldUsageDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-field-usage.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  onboardingAnswerFiles,
  onboardingAnswers,
  questionnaireFields,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormAccessService } from "@/server/workspace/crm/services/onboarding/onboarding-form-access-service";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";
import { questionnaireDefinitionReadService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-read-service";

/**
 * What deleting a field of a form would take along; null when the form is out of reach or the
 * field is not one of its own. A group counts for its sub-fields. An answer is one answered slot:
 * the several rows of a multi choice count once.
 */
export async function getOnboardingFieldUsage(
  formId: string,
  fieldId: string,
  actor: WorkspaceActor,
): Promise<OnboardingFieldUsageDto | null> {
  if (
    !onboardingFormSchemas.entityId.safeParse(formId).success ||
    !onboardingFormSchemas.entityId.safeParse(fieldId).success
  )
    return null;
  const db = getDrizzleDatabaseClient();
  const form = await onboardingFormAccessService.findReadableForm(
    db,
    formId,
    actor,
  );
  if (
    !form ||
    !(await questionnaireDefinitionReadService.findFieldBlockId(
      db,
      fieldId,
      form.id,
    ))
  )
    return null;

  const fields = await db
    .select({ id: questionnaireFields.id })
    .from(questionnaireFields)
    .where(
      or(
        eq(questionnaireFields.id, fieldId),
        eq(questionnaireFields.parent_field_id, fieldId),
      ),
    );
  const fieldIds = fields.map((field) => field.id);
  const [slots, [links]] = await Promise.all([
    db
      .selectDistinct({
        fieldId: onboardingAnswers.field_id,
        groupEntryId: onboardingAnswers.group_entry_id,
      })
      .from(onboardingAnswers)
      .where(
        and(
          eq(onboardingAnswers.form_id, form.id),
          inArray(onboardingAnswers.field_id, fieldIds),
        ),
      ),
    db
      .select({ files: count() })
      .from(onboardingAnswerFiles)
      .where(
        and(
          eq(onboardingAnswerFiles.form_id, form.id),
          inArray(onboardingAnswerFiles.field_id, fieldIds),
        ),
      ),
  ]);
  return { answers: slots.length, files: links.files };
}
