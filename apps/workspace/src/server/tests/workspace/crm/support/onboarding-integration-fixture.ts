import { and, eq, isNull, like } from "drizzle-orm";

import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { CreateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-field-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireTemplateDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template.dto";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import {
  files,
  onboardingAnswerFiles,
  onboardingAnswers,
  onboardingForms,
  onboardingGroupEntries,
  questionnaireBlocks,
  questionnaireTemplates,
} from "@invessiv/db/record-configuration";
import { createQuestionnaireBlock } from "@/server/workspace/crm/command-handler/create-questionnaire-block.command-handler";
import { createQuestionnaireField } from "@/server/workspace/crm/command-handler/create-questionnaire-field.command-handler";
import { createQuestionnaireTemplate } from "@/server/workspace/crm/command-handler/create-questionnaire-template.command-handler";
import { updateQuestionnaireTemplate } from "@/server/workspace/crm/command-handler/update-questionnaire-template.command-handler";
import { createFeedbackIntegrationFixture } from "../../../shared/services/feedback/feedback-integration-fixture";
import { fieldRequestFixture } from "./questionnaire-definition-fixtures";

type FieldSpec = {
  key: string;
  type: QuestionnaireFieldType;
  /** Key of the group this sub-field belongs to. */
  parent?: string;
  overrides?: Partial<CreateQuestionnaireFieldRequestDto>;
};

type AnswerInput = {
  value?: string;
  choiceId?: string;
  groupEntryId?: string;
  sortOrder?: number;
};

/** Projects, actors and a small catalog for the onboarding form integration tests. */
export function createOnboardingIntegrationFixture() {
  const f = createFeedbackIntegrationFixture();
  const keyPrefix = `itest_onbf_${crypto.randomUUID().slice(0, 8)}`;
  const titlePrefix = `integration:onboarding:${keyPrefix}`;
  let keySequence = 0;

  function value<T>(
    result: QuestionnaireCommandResult<T> | OnboardingCommandResult<T>,
  ): T {
    if (!result.ok) throw new Error(`expected success, got ${result.code}`);
    return result.value;
  }

  async function catalogBlock(
    fields: readonly FieldSpec[] = [],
    options: { carryOver?: boolean } = {},
  ): Promise<QuestionnaireBlockDto> {
    let block = value(
      await createQuestionnaireBlock({
        key: `${keyPrefix}_${(keySequence += 1)}`,
        carryOver: options.carryOver ?? false,
        translations: {
          de: { title: "Baustein", intro: null },
          en: { title: "Block", intro: null },
        },
      }),
    );
    for (const field of fields) {
      const parent = field.parent
        ? block.fields.find((candidate) => candidate.key === field.parent)!
        : null;
      block = value(
        await createQuestionnaireField(
          block.id,
          fieldRequestFixture(field.key, field.type, block.version, {
            parentFieldId: parent?.id ?? null,
            ...field.overrides,
          }),
        ),
      );
    }
    return block;
  }

  async function template(
    blockIds: readonly string[],
    status: QuestionnaireCatalogStatus = QuestionnaireCatalogStatus.Active,
  ): Promise<QuestionnaireTemplateDto> {
    const title = `${titlePrefix}:${(keySequence += 1)}`;
    const created = value(
      await createQuestionnaireTemplate({ title, description: null }),
    );
    return value(
      await updateQuestionnaireTemplate(created.id, {
        title,
        description: null,
        status,
        blockIds: [...blockIds],
        version: created.version,
      }),
    );
  }

  /** Moves a form straight to a status, as the later tasks' commands will. */
  async function setFormStatus(formId: string, status: OnboardingFormStatus) {
    const now = new Date();
    const draft = status === OnboardingFormStatus.Draft;
    const submitted =
      status !== OnboardingFormStatus.Draft &&
      status !== OnboardingFormStatus.Open;
    const completed = status === OnboardingFormStatus.Completed;
    await f
      .database()
      .update(onboardingForms)
      .set({
        status,
        released_at: draft ? null : now,
        released_by_member_id: draft ? null : f.memberId,
        submitted_at: submitted ? now : null,
        completed_at: completed ? now : null,
        completed_by_member_id: completed ? f.memberId : null,
        call_held_on: completed ? "2026-09-01" : null,
      })
      .where(eq(onboardingForms.id, formId));
  }

  async function answer(
    form: OnboardingFormDto,
    fieldId: string,
    input: AnswerInput,
  ) {
    await f
      .database()
      .insert(onboardingAnswers)
      .values({
        id: crypto.randomUUID(),
        form_id: form.id,
        field_id: fieldId,
        group_entry_id: input.groupEntryId ?? null,
        choice_id: input.choiceId ?? null,
        value: input.value ?? null,
        sort_order: input.sortOrder ?? 0,
        updated_by_portal_membership_id: f.membershipId,
        updated_by_member_id: null,
      });
  }

  async function groupEntry(
    form: OnboardingFormDto,
    fieldId: string,
    position: number,
  ): Promise<string> {
    const id = crypto.randomUUID();
    await f
      .database()
      .insert(onboardingGroupEntries)
      .values({ id, form_id: form.id, field_id: fieldId, position });
    return id;
  }

  /** A ready link entry of the customer, attached to a files field. */
  async function answerFile(
    form: OnboardingFormDto,
    fieldId: string,
    position: number,
    groupEntryId: string | null = null,
  ): Promise<string> {
    const fileId = crypto.randomUUID();
    await f
      .database()
      .insert(files)
      .values({
        id: fileId,
        customer_id: form.customerId,
        project_id: form.projectId,
        source: FileSource.Link,
        status: FileStatus.Ready,
        asset_kind: AssetKind.Link,
        display_name: "Logo",
        url: `https://example.com/${fileId}`,
        visible_to_customer: true,
        uploaded_by_side: UploadSide.Customer,
        uploaded_by_portal_membership_id: f.membershipId,
        version: 1,
      });
    await f.database().insert(onboardingAnswerFiles).values({
      id: crypto.randomUUID(),
      form_id: form.id,
      field_id: fieldId,
      group_entry_id: groupEntryId,
      file_id: fileId,
      position,
    });
    return fileId;
  }

  async function readFormRow(formId: string) {
    const [row] = await f
      .database()
      .select()
      .from(onboardingForms)
      .where(eq(onboardingForms.id, formId));
    return row;
  }

  async function formOfProject(projectId: string) {
    const [row] = await f
      .database()
      .select()
      .from(onboardingForms)
      .where(eq(onboardingForms.project_id, projectId));
    return row;
  }

  async function cleanup() {
    const db = f.database();
    if (db) {
      await db
        .delete(questionnaireTemplates)
        .where(like(questionnaireTemplates.title, `${titlePrefix}%`));
      // Form copies go with their form, which goes with the project in the fixture cleanup.
      await db
        .delete(questionnaireBlocks)
        .where(
          and(
            like(questionnaireBlocks.key, `${keyPrefix}%`),
            isNull(questionnaireBlocks.owner_form_id),
          ),
        );
    }
    await f.cleanup();
  }

  return {
    ...f,
    cleanup,
    keyPrefix,
    value,
    catalogBlock,
    template,
    setFormStatus,
    answer,
    groupEntry,
    answerFile,
    readFormRow,
    formOfProject,
  };
}
