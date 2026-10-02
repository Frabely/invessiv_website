import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  onboardingFormBlocks,
  onboardingForms,
  questionnaireTemplateBlocks,
  questionnaireTemplates,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { OnboardingFormRow } from "@/server/shared/services/onboarding/onboarding-form-types";
import { questionnaireBlockCopyService } from "@/server/workspace/crm/services/questionnaire/questionnaire-block-copy-service";
import { questionnaireDefinitionReadService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";
import type { OnboardingProjectRef } from "./onboarding-form-access-types";
import { onboardingPrefillService } from "./onboarding-prefill-service";

type CreatedForm =
  | { ok: true; form: OnboardingFormRow }
  | {
      ok: false;
      code:
        | typeof QuestionnaireErrorCode.TemplateNotFound
        | typeof OnboardingErrorCode.TemplateBlockArchived;
    };

/** The catalog blocks of an active template in template order; null for an unknown or archived one. */
async function findTemplateBlocks(
  tx: ContactDatabaseTransaction,
  templateId: string,
): Promise<QuestionnaireBlockDto[] | null> {
  const [template] = await tx
    .select({ id: questionnaireTemplates.id })
    .from(questionnaireTemplates)
    .where(
      and(
        eq(questionnaireTemplates.id, templateId),
        eq(questionnaireTemplates.status, QuestionnaireCatalogStatus.Active),
      ),
    )
    .limit(1)
    .for("share");
  if (!template) return null;
  const selection = await tx
    .select({ blockId: questionnaireTemplateBlocks.block_id })
    .from(questionnaireTemplateBlocks)
    .where(eq(questionnaireTemplateBlocks.template_id, templateId))
    .orderBy(asc(questionnaireTemplateBlocks.position));
  return questionnaireDefinitionReadService.findBlocks(
    tx,
    selection.map((row) => row.blockId),
    null,
  );
}

/** Makes a block of the form its step at `position`, not yet reviewed. */
async function appendStep(
  tx: ContactDatabaseTransaction,
  formId: string,
  blockId: string,
  position: number,
): Promise<void> {
  await tx.insert(onboardingFormBlocks).values({
    form_id: formId,
    block_id: blockId,
    position,
    review_status: OnboardingBlockReviewStatus.Pending,
    clarification_mode: null,
    review_note: null,
    reviewed_by_member_id: null,
    reviewed_at: null,
    version: 1,
  });
}

/** Snapshot copy of a catalog block as the step at `position`; answers with the id of the copy. */
async function appendCatalogBlock(
  tx: ContactDatabaseTransaction,
  formId: string,
  source: QuestionnaireBlockDto,
  position: number,
): Promise<string> {
  const blockId = await questionnaireBlockCopyService.copyBlock(tx, source, {
    ownerFormId: formId,
    key: source.key,
  });
  await appendStep(tx, formId, blockId, position);
  return blockId;
}

/**
 * The draft of a project with one copy per template block and the pre-fill of those copies. A
 * template that is gone or archived is refused, and so is one that still lists an archived block:
 * a retired block must not come back through a template, as it cannot be added by hand either.
 * Runs in the caller's transaction: a failing copy leaves no form behind.
 */
async function createForm(
  tx: ContactDatabaseTransaction,
  input: {
    project: OnboardingProjectRef;
    templateId: string | null;
    actor: WorkspaceActor;
  },
): Promise<CreatedForm> {
  const sources = input.templateId
    ? await findTemplateBlocks(tx, input.templateId)
    : [];
  if (!sources)
    return { ok: false, code: QuestionnaireErrorCode.TemplateNotFound };
  if (
    sources.some((block) => block.status !== QuestionnaireCatalogStatus.Active)
  )
    return { ok: false, code: OnboardingErrorCode.TemplateBlockArchived };

  const [form] = await tx
    .insert(onboardingForms)
    .values({
      id: crypto.randomUUID(),
      customer_id: input.project.customerId,
      project_id: input.project.id,
      source_template_id: input.templateId,
      status: OnboardingFormStatus.Draft,
      created_by_member_id: input.actor.workspaceMemberId,
      released_at: null,
      released_by_member_id: null,
      submitted_at: null,
      submitted_by_portal_membership_id: null,
      services_confirmed_at: null,
      services_confirmed_by_portal_membership_id: null,
      services_note: null,
      call_held_on: null,
      completed_at: null,
      completed_by_member_id: null,
      version: 1,
    })
    .returning();

  const blockIds: string[] = [];
  for (const [position, source] of sources.entries())
    blockIds.push(await appendCatalogBlock(tx, form.id, source, position));
  await onboardingPrefillService.prefillBlocks(tx, {
    form,
    blockIds,
    actor: input.actor,
  });
  return { ok: true, form };
}

export const onboardingFormCreateService = {
  appendCatalogBlock,
  appendStep,
  createForm,
} as const;
