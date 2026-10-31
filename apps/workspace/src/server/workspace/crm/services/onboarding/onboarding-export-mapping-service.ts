import "server-only";

import { OnboardingExportAnswerKind } from "@invessiv/common/constants/crm/onboarding/onboarding-export-answer-kinds";
import { OnboardingExportFileStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-export-file-statuses";
import {
  ONBOARDING_EXPORT_ENTRY_FOLDER_PREFIX,
  ONBOARDING_EXPORT_FILES_FOLDER,
  ONBOARDING_EXPORT_SCHEMA_VERSION,
  ONBOARDING_EXPORT_SHARED_FOLDER,
} from "@invessiv/common/constants/crm/onboarding/onboarding-export-format";
import { QUESTIONNAIRE_CONFIRMED_VALUE } from "@invessiv/common/constants/crm/questionnaire/questionnaire-confirmed-value";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { QuestionnaireScaleChoiceKey } from "@invessiv/common/constants/crm/questionnaire/questionnaire-scale-choice-keys";
import type { OnboardingExportAnswer } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export-answer";
import type { OnboardingExportBlockDto } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export-block.dto";
import type { OnboardingExportConditionDto } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export-condition.dto";
import type { OnboardingExportDto } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export.dto";
import type { OnboardingExportFieldDto } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export-field.dto";
import type { OnboardingExportFileDto } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export-file.dto";
import type { OnboardingExportFileUsageDto } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export-file-usage.dto";
import type { OnboardingFormBlockDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-block.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireAnswerDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer.dto";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireCompletenessInput } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-completeness-input";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { compareByPosition } from "@invessiv/common/patterns/collections/compare-by-position";
import { groupBy } from "@invessiv/common/patterns/collections/group-by";
import { toOnboardingCompletenessInput } from "@invessiv/common/patterns/crm/onboarding/onboarding-completeness-input";
import { questionnaireSlotKey as slotKey } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-answer-slot";
import { isQuestionnaireFieldVisible } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { resolveQuestionnaireBlock } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-resolved-block";
import type { OnboardingExportFileLocation } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export-file-location";
import type { OnboardingExportMappingInput } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export-mapping-input";

type FormIndex = {
  completeness: QuestionnaireCompletenessInput;
  answers: ReadonlyMap<string, QuestionnaireAnswerDto[]>;
  visibleFiles: ReadonlyMap<string, QuestionnaireAnswerFileDto[]>;
  hiddenFileCounts: ReadonlyMap<string, number>;
  entries: ReadonlyMap<string, QuestionnaireGroupEntryDto[]>;
  files: ReadonlyMap<string, OnboardingExportFileDto>;
  servicesConfirmed: boolean;
};

type BlockIndex = {
  form: FormIndex;
  fields: ReadonlyMap<string, QuestionnaireFieldDto>;
  resolved: ReadonlyMap<string, QuestionnaireResolvedField>;
};

const NO_ACCESS_FILE: OnboardingExportFileDto = {
  fileId: null,
  name: null,
  kind: null,
  status: OnboardingExportFileStatus.NoAccess,
  path: null,
  url: null,
  note: null,
  usedIn: [],
};

type FileSlot = { folder: string; usage: OnboardingExportFileUsageDto };

function byPosition<T extends { position: number }>(items: readonly T[]): T[] {
  return [...items].sort(compareByPosition);
}

function flatten<T extends { children: readonly T[] }>(fields: readonly T[]) {
  return fields.flatMap((field) => [field, ...field.children]);
}

function indexForm(input: OnboardingExportMappingInput): FormIndex {
  const { form } = input;
  const slotOf = (row: { fieldId: string; groupEntryId: string | null }) =>
    slotKey(row.fieldId, row.groupEntryId);
  const hiddenFileCounts = new Map<string, number>();
  for (const ref of form.hiddenAnswerFiles)
    hiddenFileCounts.set(
      slotOf(ref),
      (hiddenFileCounts.get(slotOf(ref)) ?? 0) + 1,
    );
  return {
    completeness: toOnboardingCompletenessInput(form),
    answers: groupBy(form.answers, slotOf),
    visibleFiles: groupBy(form.answerFiles, slotOf),
    hiddenFileCounts,
    entries: groupBy(form.groupEntries, (entry) => entry.fieldId),
    files: input.files,
    servicesConfirmed: form.servicesConfirmedAt !== null,
  };
}

function textValue(answers: readonly QuestionnaireAnswerDto[]): string | null {
  const value = answers.find((answer) => answer.value !== null)?.value ?? null;
  return value === null || value.trim() === "" ? null : value;
}

function scaleValue(answers: readonly QuestionnaireAnswerDto[]): number | null {
  const step = Number(textValue(answers));
  return Number.isInteger(step) &&
    step >= 1 &&
    step <= QUESTIONNAIRE_LIMITS.scaleSteps
    ? step
    : null;
}

function mapAnswer(
  field: QuestionnaireFieldDto,
  groupEntryId: string | null,
  index: BlockIndex,
): OnboardingExportAnswer {
  const slot = slotKey(field.id, groupEntryId);
  const answers = index.form.answers.get(slot) ?? [];
  const labelOf = (choiceId: string) =>
    index.resolved
      .get(field.id)
      ?.choices.find((choice) => choice.id === choiceId)?.label ?? "";
  switch (field.type) {
    case QuestionnaireFieldType.Choice:
    case QuestionnaireFieldType.MultiChoice:
    case QuestionnaireFieldType.YesNo: {
      const selected = new Set(answers.map((answer) => answer.choiceId));
      return {
        kind: OnboardingExportAnswerKind.Choice,
        multiple: field.type === QuestionnaireFieldType.MultiChoice,
        options: byPosition(field.choices).map((choice) => ({
          key: choice.key,
          label: labelOf(choice.id),
          selected: selected.has(choice.id),
        })),
      };
    }
    case QuestionnaireFieldType.Scale: {
      const pole = (key: string) => {
        const choice = field.choices.find((option) => option.key === key);
        return choice ? labelOf(choice.id) : "";
      };
      return {
        kind: OnboardingExportAnswerKind.Scale,
        value: scaleValue(answers),
        steps: QUESTIONNAIRE_LIMITS.scaleSteps,
        lowLabel: pole(QuestionnaireScaleChoiceKey.Low),
        highLabel: pole(QuestionnaireScaleChoiceKey.High),
      };
    }
    case QuestionnaireFieldType.Confirmation:
      return {
        kind: OnboardingExportAnswerKind.Confirmation,
        confirmed: answers.some(
          (answer) => answer.value === QUESTIONNAIRE_CONFIRMED_VALUE,
        ),
      };
    case QuestionnaireFieldType.ProjectServices:
      return {
        kind: OnboardingExportAnswerKind.Confirmation,
        confirmed: index.form.servicesConfirmed,
      };
    case QuestionnaireFieldType.Files:
      return {
        kind: OnboardingExportAnswerKind.Files,
        files: [
          ...byPosition(index.form.visibleFiles.get(slot) ?? []).map(
            (link) => index.form.files.get(link.file.id) ?? NO_ACCESS_FILE,
          ),
          ...Array.from(
            { length: index.form.hiddenFileCounts.get(slot) ?? 0 },
            () => NO_ACCESS_FILE,
          ),
        ],
      };
    case QuestionnaireFieldType.Group: {
      const children = byPosition(field.children);
      return {
        kind: OnboardingExportAnswerKind.Group,
        questions: children.map((child) => mapField(child, null, index)),
        entries: byPosition(index.form.entries.get(field.id) ?? []).map(
          (entry, position) => ({
            number: position + 1,
            fields: children.map((child) => mapField(child, entry.id, index)),
          }),
        ),
      };
    }
    default:
      return {
        kind: OnboardingExportAnswerKind.Text,
        value: textValue(answers),
      };
  }
}

function isAnswered(answer: OnboardingExportAnswer): boolean {
  switch (answer.kind) {
    case OnboardingExportAnswerKind.Text:
    case OnboardingExportAnswerKind.Scale:
      return answer.value !== null;
    case OnboardingExportAnswerKind.Choice:
      return answer.options.some((option) => option.selected);
    case OnboardingExportAnswerKind.Confirmation:
      return answer.confirmed;
    case OnboardingExportAnswerKind.Files:
      return answer.files.length > 0;
    case OnboardingExportAnswerKind.Group:
      return answer.entries.length > 0;
  }
}

function mapCondition(
  field: QuestionnaireFieldDto,
  index: BlockIndex,
): OnboardingExportConditionDto | null {
  if (field.conditionFieldId === null || field.conditionChoiceId === null)
    return null;
  const trigger = index.fields.get(field.conditionFieldId);
  const choice = trigger?.choices.find(
    (option) => option.id === field.conditionChoiceId,
  );
  if (!trigger || !choice) return null;
  return {
    fieldKey: trigger.key,
    optionKey: choice.key,
    optionLabel:
      index.resolved
        .get(trigger.id)
        ?.choices.find((option) => option.id === choice.id)?.label ?? "",
  };
}

function mapField(
  field: QuestionnaireFieldDto,
  groupEntryId: string | null,
  index: BlockIndex,
): OnboardingExportFieldDto {
  const resolved = index.resolved.get(field.id);
  const answer = mapAnswer(field, groupEntryId, index);
  return {
    key: field.key,
    type: field.type,
    label: resolved?.label ?? "",
    help: resolved?.help ?? null,
    required: field.requirement === QuestionnaireFieldRequirement.Required,
    visible: isQuestionnaireFieldVisible(
      field,
      index.form.completeness,
      groupEntryId,
    ),
    condition: mapCondition(field, index),
    maxLength: field.maxLength,
    minItems: field.minItems,
    maxItems: field.maxItems,
    acceptedAssetKinds: field.acceptedAssetKinds,
    answered: isAnswered(answer),
    answer,
  };
}

function mapBlock(
  step: OnboardingFormBlockDto,
  form: FormIndex,
  locale: Locale,
): OnboardingExportBlockDto {
  const resolved = resolveQuestionnaireBlock(step.block, locale);
  const index: BlockIndex = {
    form,
    fields: new Map(
      flatten(step.block.fields).map((field) => [field.id, field]),
    ),
    resolved: new Map(
      flatten(resolved.fields).map((field) => [field.id, field]),
    ),
  };
  return {
    key: step.block.key,
    title: resolved.title,
    intro: resolved.intro,
    reviewStatus: step.reviewStatus,
    reviewNote: step.reviewNote,
    fields: byPosition(step.block.fields).map((field) =>
      mapField(field, null, index),
    ),
  };
}

/**
 * The whole form as `onboarding.json`: every question, answered or not, visible or not. Files come
 * in through `input.files` because only the archive knows which of them made it in.
 */
function map(input: OnboardingExportMappingInput): OnboardingExportDto {
  const { form, context, locale } = input;
  const index = indexForm(input);
  return {
    schemaVersion: ONBOARDING_EXPORT_SCHEMA_VERSION,
    exportedAt: input.exportedAt,
    locale,
    customerName: context.customerName,
    projectTitle: context.projectTitle,
    projectPhase: context.projectPhase,
    templateTitle: context.templateTitle,
    status: form.status,
    releasedAt: form.releasedAt,
    submittedAt: form.submittedAt,
    callHeldOn: form.callHeldOn,
    completedAt: form.completedAt,
    services: {
      confirmedAt: form.servicesConfirmedAt,
      note: form.servicesNote,
      changedSinceConfirmation: form.servicesChangedSinceConfirmation,
      items: byPosition(form.services).map((service) => ({
        title: service.title,
        description: service.description,
      })),
    },
    blocks: byPosition(form.blocks).map((step) =>
      mapBlock(step, index, locale),
    ),
  };
}

/**
 * Every files slot in form order, keyed by `questionnaireSlotKey`, with its archive folder: block
 * key, field key and, inside a group, the entry number and the sub-field key. Keys are path-safe.
 */
function toFileSlots(form: OnboardingFormDto): Map<string, FileSlot> {
  const slots = new Map<string, FileSlot>();
  const entries = groupBy(form.groupEntries, (entry) => entry.fieldId);
  for (const step of byPosition(form.blocks)) {
    const blockKey = step.block.key;
    const base = `${ONBOARDING_EXPORT_FILES_FOLDER}/${blockKey}`;
    for (const field of byPosition(step.block.fields)) {
      if (field.type === QuestionnaireFieldType.Files)
        slots.set(slotKey(field.id, null), {
          folder: `${base}/${field.key}`,
          usage: {
            blockKey,
            groupKey: null,
            entryNumber: null,
            fieldKey: field.key,
          },
        });
      if (field.type !== QuestionnaireFieldType.Group) continue;
      byPosition(entries.get(field.id) ?? []).forEach((entry, position) => {
        const entryNumber = position + 1;
        const entryFolder = `${base}/${field.key}/${ONBOARDING_EXPORT_ENTRY_FOLDER_PREFIX}${entryNumber}`;
        for (const child of byPosition(field.children))
          if (child.type === QuestionnaireFieldType.Files)
            slots.set(slotKey(child.id, entry.id), {
              folder: `${entryFolder}/${child.key}`,
              usage: {
                blockKey,
                groupKey: field.key,
                entryNumber,
                fieldKey: child.key,
              },
            });
      });
    }
  }
  return slots;
}

/**
 * Where each readable file goes, keyed by file id. A file used by one question lies in that
 * question's folder; one used by several is packed once into the shared folder, and every use
 * stays listed in `usedIn`.
 */
function toFileLocations(
  form: OnboardingFormDto,
): Map<string, OnboardingExportFileLocation> {
  const slots = toFileSlots(form);
  const order = new Map(
    [...slots.keys()].map((key, position) => [key, position]),
  );
  const slotOf = (link: QuestionnaireAnswerFileDto) =>
    slotKey(link.fieldId, link.groupEntryId);
  const locations = new Map<string, OnboardingExportFileLocation>();
  for (const [fileId, links] of groupBy(
    form.answerFiles,
    (link) => link.file.id,
  )) {
    const used = [...new Set(links.map(slotOf))]
      .filter((key) => slots.has(key))
      .sort((left, right) => order.get(left)! - order.get(right)!)
      .map((key) => slots.get(key)!);
    locations.set(fileId, {
      folder:
        used.length === 1
          ? used[0]!.folder
          : `${ONBOARDING_EXPORT_FILES_FOLDER}/${ONBOARDING_EXPORT_SHARED_FOLDER}`,
      usedIn: used.map((slot) => slot.usage),
    });
  }
  return locations;
}

/** One file as the manifest names it; only an included file carries its archive path. */
function toExportFile(
  file: FileAttachmentDto,
  status: OnboardingExportFileStatus,
  usedIn: readonly OnboardingExportFileUsageDto[],
  path: string | null = null,
): OnboardingExportFileDto {
  return {
    fileId: file.id,
    name: file.displayName,
    kind: file.assetKind,
    status,
    path: status === OnboardingExportFileStatus.Included ? path : null,
    url: file.url,
    note: file.note,
    usedIn: [...usedIn],
  };
}

export const onboardingExportMappingService = {
  map,
  toExportFile,
  toFileLocations,
};
