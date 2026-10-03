import "server-only";

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import {
  QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES,
  QuestionnaireFieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS as L } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import { flattenQuestionnaireFields } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { validateQuestionnaireValue } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-field-value";
import type {
  ContactDatabaseReader,
  ContactDatabaseTransaction,
} from "@invessiv/db/core";
import {
  files,
  onboardingAnswerFiles,
  onboardingAnswers,
  onboardingFormBlocks,
  onboardingForms,
  onboardingGroupEntries,
  questionnaireBlocks,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import type {
  OnboardingAnswerFileRow,
  OnboardingAnswerRow,
  OnboardingGroupEntryRow,
  OnboardingSlotContent,
  OnboardingSlotWrite,
} from "@/server/shared/services/onboarding/onboarding-form-types";
import { questionnaireDefinitionReadService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import type { PrefillRows, PrefillTarget } from "./onboarding-prefill-types";

/** What the last completed form holds for the blocks that are taken over. */
type SourceContent = {
  answers: OnboardingAnswerRow[];
  entries: OnboardingGroupEntryRow[];
  files: { link: OnboardingAnswerFileRow; assetKind: AssetKind }[];
};

/** One slot of a form: a field on block level, or a sub-field within one group entry. */
type Slot = { field: QuestionnaireFieldDto; entryId: string | null };

const CHOICE_ANSWER_TYPES: readonly QuestionnaireFieldType[] =
  QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES;

// A confirmation is an act of consent in its own form and the service confirmation belongs to
// the booked services of that project; neither is taken over.
const NEVER_CARRIED_TYPES: readonly QuestionnaireFieldType[] = [
  QuestionnaireFieldType.Confirmation,
  QuestionnaireFieldType.ProjectServices,
];

/**
 * The newest completed form of the customer that the actor may read; a form that is still open is
 * never a source. A role bound to one project must not receive the answers of a sibling project.
 */
async function findSourceForm(
  executor: ContactDatabaseReader,
  customerId: string,
  actor: WorkspaceActor,
): Promise<{ id: string } | null> {
  const [form] = await executor
    .select({ id: onboardingForms.id })
    .from(onboardingForms)
    .where(
      and(
        eq(onboardingForms.customer_id, customerId),
        eq(onboardingForms.status, OnboardingFormStatus.Completed),
        crmAccessCondition.forScope(
          accessScope(actor, Permission.ProjectsRead),
          {
            customerId: onboardingForms.customer_id,
            projectId: onboardingForms.project_id,
          },
        ),
      ),
    )
    .orderBy(desc(onboardingForms.completed_at))
    .limit(1);
  return form ?? null;
}

/** The blocks of the source form by catalog origin; the first step wins if an origin occurs twice. */
async function loadSourceBlocks(
  tx: ContactDatabaseTransaction,
  sourceFormId: string,
  originIds: readonly string[],
): Promise<Map<string, QuestionnaireBlockDto>> {
  const steps = await tx
    .select({ blockId: questionnaireBlocks.id })
    .from(questionnaireBlocks)
    .innerJoin(
      onboardingFormBlocks,
      eq(onboardingFormBlocks.block_id, questionnaireBlocks.id),
    )
    .where(
      and(
        eq(questionnaireBlocks.owner_form_id, sourceFormId),
        inArray(questionnaireBlocks.source_block_id, [...originIds]),
      ),
    )
    .orderBy(asc(onboardingFormBlocks.position));
  const blocks = await questionnaireDefinitionReadService.findBlocks(
    tx,
    steps.map((step) => step.blockId),
    sourceFormId,
  );
  const byOrigin = new Map<string, QuestionnaireBlockDto>();
  for (const block of blocks)
    if (block.sourceBlockId && !byOrigin.has(block.sourceBlockId))
      byOrigin.set(block.sourceBlockId, block);
  return byOrigin;
}

/** Only finished, not orphaned files are linked again; a dead entry is not carried forward. */
async function loadSourceContent(
  tx: ContactDatabaseTransaction,
  sourceFormId: string,
  fieldIds: readonly string[],
): Promise<SourceContent> {
  if (fieldIds.length === 0) return { answers: [], entries: [], files: [] };
  const [answers, entries, links] = await Promise.all([
    tx
      .select()
      .from(onboardingAnswers)
      .where(
        and(
          eq(onboardingAnswers.form_id, sourceFormId),
          inArray(onboardingAnswers.field_id, [...fieldIds]),
        ),
      ),
    tx
      .select()
      .from(onboardingGroupEntries)
      .where(
        and(
          eq(onboardingGroupEntries.form_id, sourceFormId),
          inArray(onboardingGroupEntries.field_id, [...fieldIds]),
        ),
      ),
    tx
      .select({ link: onboardingAnswerFiles, assetKind: files.asset_kind })
      .from(onboardingAnswerFiles)
      .innerJoin(
        files,
        and(
          eq(files.id, onboardingAnswerFiles.file_id),
          eq(files.status, FileStatus.Ready),
          isNull(files.orphaned_at),
        ),
      )
      .where(
        and(
          eq(onboardingAnswerFiles.form_id, sourceFormId),
          inArray(onboardingAnswerFiles.field_id, [...fieldIds]),
        ),
      ),
  ]);
  return { answers, entries, files: links };
}

/** Fields are matched by key and type only; anything else would be a guess. */
function matchField(
  candidates: readonly QuestionnaireFieldDto[],
  field: QuestionnaireFieldDto,
): QuestionnaireFieldDto | undefined {
  return candidates.find(
    (candidate) => candidate.key === field.key && candidate.type === field.type,
  );
}

function slotWrite(
  target: PrefillTarget,
  slot: Slot,
  content: OnboardingSlotContent,
): OnboardingSlotWrite {
  return {
    slot: {
      formId: target.form.id,
      fieldId: slot.field.id,
      groupEntryId: slot.entryId,
    },
    content,
  };
}

/**
 * Takes over one slot. Options are matched by key, values are checked against the new field;
 * what does not fit any more is dropped.
 */
function carrySlot(
  target: PrefillTarget,
  from: Slot,
  to: Slot,
  content: SourceContent,
  rows: PrefillRows,
): void {
  const { field } = to;
  if (NEVER_CARRIED_TYPES.includes(field.type)) return;

  if (field.type === QuestionnaireFieldType.Files) {
    content.files
      .filter(
        ({ link, assetKind }) =>
          link.field_id === from.field.id &&
          link.group_entry_id === from.entryId &&
          (field.acceptedAssetKinds === null ||
            field.acceptedAssetKinds.includes(assetKind)),
      )
      .sort((left, right) => left.link.position - right.link.position)
      .slice(0, field.maxItems ?? L.filesPerField)
      .forEach(({ link }, position) =>
        rows.files.push({
          slot: {
            formId: target.form.id,
            fieldId: field.id,
            groupEntryId: to.entryId,
          },
          fileId: link.file_id,
          position,
        }),
      );
    return;
  }

  const stored = content.answers
    .filter(
      (answer) =>
        answer.field_id === from.field.id &&
        answer.group_entry_id === from.entryId,
    )
    .sort((left, right) => left.sort_order - right.sort_order);

  if (CHOICE_ANSWER_TYPES.includes(field.type)) {
    const keyById = new Map(
      from.field.choices.map((choice) => [choice.id, choice.key]),
    );
    const idByKey = new Map(
      field.choices.map((choice) => [choice.key, choice.id]),
    );
    const limit =
      field.type === QuestionnaireFieldType.MultiChoice
        ? (field.maxItems ?? L.choicesPerField)
        : 1;
    const choiceIds = stored
      .flatMap((answer) => {
        const key = answer.choice_id ? keyById.get(answer.choice_id) : null;
        return (key && idByKey.get(key)) || [];
      })
      .slice(0, limit);
    if (choiceIds.length > 0)
      rows.answers.push(slotWrite(target, to, { choiceIds }));
    return;
  }

  const value = stored[0]?.value;
  if (value && validateQuestionnaireValue(field, value).ok)
    rows.answers.push(slotWrite(target, to, { values: [value] }));
}

/** Group entries keep their order and get new ids; their sub-fields are taken over per entry. */
function carryBlock(
  target: PrefillTarget,
  source: QuestionnaireBlockDto,
  block: QuestionnaireBlockDto,
  content: SourceContent,
  rows: PrefillRows,
): void {
  for (const field of block.fields) {
    const origin = matchField(source.fields, field);
    if (!origin) continue;
    if (field.type !== QuestionnaireFieldType.Group) {
      carrySlot(
        target,
        { field: origin, entryId: null },
        { field, entryId: null },
        content,
        rows,
      );
      continue;
    }
    const entries = content.entries
      .filter((entry) => entry.field_id === origin.id)
      .sort((left, right) => left.position - right.position)
      .slice(0, field.maxItems ?? L.groupEntriesPerField);
    for (const [position, entry] of entries.entries()) {
      const entryId = crypto.randomUUID();
      rows.entries.push({
        id: entryId,
        formId: target.form.id,
        fieldId: field.id,
        position,
      });
      for (const child of field.children) {
        const childOrigin = matchField(origin.children, child);
        if (childOrigin)
          carrySlot(
            target,
            { field: childOrigin, entryId: entry.id },
            { field: child, entryId },
            content,
            rows,
          );
      }
    }
  }
}

/** Company-wide blocks take over what the customer said in the last completed form. */
async function carryOver(
  tx: ContactDatabaseTransaction,
  target: PrefillTarget,
  blocks: readonly QuestionnaireBlockDto[],
  rows: PrefillRows,
): Promise<void> {
  const carried = blocks.filter(
    (block) => block.carryOver && block.sourceBlockId !== null,
  );
  if (carried.length === 0) return;
  const sourceForm = await findSourceForm(
    tx,
    target.form.customer_id,
    target.actor,
  );
  if (!sourceForm) return;
  const sources = await loadSourceBlocks(
    tx,
    sourceForm.id,
    carried.map((block) => block.sourceBlockId!),
  );
  const content = await loadSourceContent(
    tx,
    sourceForm.id,
    [...sources.values()].flatMap((block) =>
      flattenQuestionnaireFields(block.fields).map((field) => field.id),
    ),
  );
  for (const block of carried) {
    const source = sources.get(block.sourceBlockId!);
    if (source) carryBlock(target, source, block, content, rows);
  }
}

export const onboardingPrefillCarryService = {
  carryOver,
  findSourceForm,
} as const;
