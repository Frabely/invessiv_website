/**
 * Onboarding part of `db:smoke:crm`: every constraint that Postgres itself must enforce for the
 * building kit, plus the "missing business value is rejected" guard for each new table. Rules that
 * span tables (same-form answers, catalog-only template blocks, same-level conditions) belong to the
 * write paths and their integration tests, not to this smoke.
 */
import { randomBytes, randomUUID } from "node:crypto";

import type { getDatabaseClient } from "@invessiv/db/core";
import { OnboardingAnswersConstraintName as A } from "@invessiv/db/constraint-names/crm/onboarding-answers-constraint-names";
import { QuestionnaireBlockTranslationsConstraintName as BT } from "@invessiv/db/constraint-names/crm/questionnaire-block-translations-constraint-names";
import { QuestionnaireBlocksConstraintName as B } from "@invessiv/db/constraint-names/crm/questionnaire-blocks-constraint-names";
import { QuestionnaireFieldsConstraintName as F } from "@invessiv/db/constraint-names/crm/questionnaire-fields-constraint-names";
import { OnboardingFormBlocksConstraintName as FB } from "@invessiv/db/constraint-names/crm/onboarding-form-blocks-constraint-names";
import { OnboardingFormsConstraintName as O } from "@invessiv/db/constraint-names/crm/onboarding-forms-constraint-names";
import { TasksConstraintName as TK } from "@invessiv/db/constraint-names/crm/tasks-constraint-names";

type Sql = ReturnType<typeof getDatabaseClient>;

/** Keys must match the key pattern, so catalog fixtures are marked by this prefix instead of the text prefix. */
export const ONBOARDING_SMOKE_KEY_PREFIX = "smoke_crm_";

export type OnboardingSmokeContext = {
  sql: Sql;
  memberId: string;
  name: (suffix: string) => string;
  insertCustomer: (displayName: string) => Promise<string>;
  expectRejected: (
    name: string,
    run: () => Promise<unknown>,
    constraint?: string,
  ) => Promise<void>;
  expectAccepted: (name: string, run: () => Promise<unknown>) => Promise<void>;
};

function smokeKey(): string {
  return `${ONBOARDING_SMOKE_KEY_PREFIX}${randomBytes(6).toString("hex")}`;
}

export async function runOnboardingChecks(context: OnboardingSmokeContext) {
  const { sql, memberId, name, expectRejected, expectAccepted } = context;
  const customerId = await context.insertCustomer(name("Onboarding customer"));
  const otherCustomerId = await context.insertCustomer(
    name("Onboarding other customer"),
  );
  const insertProject = async (ownerCustomerId: string) => {
    const id = randomUUID();
    await sql`
      INSERT INTO projects (id, customer_id, owner_member_id, title, status, phase, process_steps,
                            current_process_step, workflow_key, billing_model, included_feedback_rounds,
                            feedback_round_positions, version)
      VALUES (${id}, ${ownerCustomerId}, ${memberId}, ${name("Onboarding project")}, 'active', 'onboarding',
              ARRAY ['Design', 'Launch'], 'Design', 'standard_web_v1', 'fixed_price', 2, ARRAY [1, 1], 1)
    `;
    return id;
  };
  const projectId = await insertProject(customerId);
  const otherProjectId = await insertProject(customerId);
  const completedProjectId = await insertProject(customerId);
  const foreignProjectId = await insertProject(otherCustomerId);

  type FormArgs = {
    projectId?: string;
    customerId?: string;
    status?: string;
    releasedAt?: Date | null;
    submittedAt?: Date | null;
    completedAt?: Date | null;
    completedByMemberId?: string | null;
    callHeldOn?: string | null;
  };
  const insertForm = async (args: FormArgs = {}) => {
    const id = randomUUID();
    const status = args.status ?? "draft";
    const releasedAt =
      args.releasedAt === undefined
        ? status === "draft"
          ? null
          : new Date()
        : args.releasedAt;
    await sql`
      INSERT INTO onboarding_forms (id, customer_id, project_id, status, created_by_member_id, released_at,
                                    released_by_member_id, submitted_at, completed_at, completed_by_member_id,
                                    call_held_on, version)
      VALUES (${id}, ${args.customerId ?? customerId}, ${args.projectId ?? projectId}, ${status}, ${memberId},
              ${releasedAt}, ${releasedAt ? memberId : null}, ${args.submittedAt ?? null},
              ${args.completedAt ?? null}, ${args.completedByMemberId ?? null}, ${args.callHeldOn ?? null}, 1)
    `;
    return id;
  };
  const now = new Date();

  await expectRejected(
    "onboarding form without status is rejected",
    () => sql`
      INSERT INTO onboarding_forms (id, customer_id, project_id, created_by_member_id, version)
      VALUES (${randomUUID()}, ${customerId}, ${otherProjectId}, ${memberId}, 1)
    `,
  );
  await expectRejected(
    "onboarding form without version is rejected",
    () => sql`
      INSERT INTO onboarding_forms (id, customer_id, project_id, status, created_by_member_id)
      VALUES (${randomUUID()}, ${customerId}, ${otherProjectId}, 'draft', ${memberId})
    `,
  );
  await expectRejected(
    "onboarding form with a customer other than the project's is rejected",
    () => insertForm({ projectId: foreignProjectId }),
    O.ProjectCustomerForeignKey,
  );
  await expectRejected(
    "released draft is rejected",
    () => insertForm({ projectId: otherProjectId, releasedAt: now }),
    O.ReleasedCheck,
  );
  await expectRejected(
    "submitted form without submission time is rejected",
    () => insertForm({ projectId: otherProjectId, status: "submitted" }),
    O.SubmittedCheck,
  );
  await expectRejected(
    "completed form without call date is rejected",
    () =>
      insertForm({
        projectId: completedProjectId,
        status: "completed",
        submittedAt: now,
        completedAt: now,
        completedByMemberId: memberId,
      }),
    O.CompletedCheck,
  );
  await expectAccepted("completed form with call date is accepted", () =>
    insertForm({
      projectId: completedProjectId,
      status: "completed",
      submittedAt: now,
      completedAt: now,
      completedByMemberId: memberId,
      callHeldOn: now.toISOString().slice(0, 10),
    }),
  );
  const formId = await insertForm({ status: "open" });
  await expectRejected(
    "a second form for the same project is rejected",
    () => insertForm(),
    O.ProjectUnique,
  );
  const otherFormId = await insertForm({ projectId: otherProjectId });

  const insertBlock = async (
    args: {
      ownerFormId?: string | null;
      key?: string;
      status?: string;
      sourceBlockId?: string | null;
    } = {},
  ) => {
    const id = randomUUID();
    await sql`
      INSERT INTO questionnaire_blocks (id, owner_form_id, source_block_id, key, carry_over, status, version)
      VALUES (${id}, ${args.ownerFormId ?? null}, ${args.sourceBlockId ?? null}, ${args.key ?? smokeKey()}, FALSE,
              ${args.status ?? "active"}, 1)
    `;
    return id;
  };
  await expectRejected(
    "onboarding block without carry_over is rejected",
    () => sql`
      INSERT INTO questionnaire_blocks (id, key, status, version)
      VALUES (${randomUUID()}, ${smokeKey()}, 'active', 1)
    `,
  );
  await expectRejected(
    "onboarding block without status is rejected",
    () => sql`
      INSERT INTO questionnaire_blocks (id, key, carry_over, version)
      VALUES (${randomUUID()}, ${smokeKey()}, FALSE, 1)
    `,
  );
  await expectRejected(
    "onboarding block without version is rejected",
    () => sql`
      INSERT INTO questionnaire_blocks (id, key, carry_over, status)
      VALUES (${randomUUID()}, ${smokeKey()}, FALSE, 'active')
    `,
  );
  await expectRejected(
    "block key with upper case is rejected",
    () => insertBlock({ key: `${ONBOARDING_SMOKE_KEY_PREFIX}Upper` }),
    B.KeyCheck,
  );
  const catalogKey = smokeKey();
  const catalogBlockId = await insertBlock({ key: catalogKey });
  await expectRejected(
    "a duplicate catalog key is rejected",
    () => insertBlock({ key: catalogKey }),
    B.CatalogKeyUnique,
  );
  await expectRejected(
    "a catalog block with an origin is rejected",
    () => insertBlock({ sourceBlockId: catalogBlockId }),
    B.CatalogSourceCheck,
  );
  await expectRejected(
    "an archived block of a form is rejected",
    () => insertBlock({ ownerFormId: formId, status: "archived" }),
    B.OwnerStatusCheck,
  );
  const blockId = await insertBlock({
    ownerFormId: formId,
    key: catalogKey,
    sourceBlockId: catalogBlockId,
  });
  await expectAccepted("a form copy may repeat the catalog key", async () => {
    const rows =
      (await sql`SELECT id FROM questionnaire_blocks WHERE id = ${blockId}`) as unknown[];
    if (rows.length !== 1) throw new Error("form copy is missing");
  });

  await expectRejected(
    "block translation without title is rejected",
    () => sql`
      INSERT INTO questionnaire_block_translations (block_id, locale)
      VALUES (${blockId}, 'de')
    `,
  );
  await expectRejected(
    "block translation in an unsupported locale is rejected",
    () => sql`
      INSERT INTO questionnaire_block_translations (block_id, locale, title)
      VALUES (${blockId}, 'fr', 'Entreprise')
    `,
    BT.LocaleCheck,
  );
  await expectAccepted(
    "block translation is accepted",
    () => sql`
    INSERT INTO questionnaire_block_translations (block_id, locale, title, intro)
    VALUES (${blockId}, 'de', 'Unternehmen', NULL)
  `,
  );

  type FieldArgs = {
    blockId?: string;
    parentFieldId?: string | null;
    position?: number;
    type?: string;
    maxLength?: number | null;
    conditionFieldId?: string | null;
    conditionChoiceId?: string | null;
  };
  const insertField = async (args: FieldArgs = {}) => {
    const id = randomUUID();
    await sql`
      INSERT INTO questionnaire_fields (id, block_id, parent_field_id, key, position, type, requirement, max_length,
                                     condition_field_id, condition_choice_id, version)
      VALUES (${id}, ${args.blockId ?? blockId}, ${args.parentFieldId ?? null}, ${smokeKey()}, ${args.position ?? 0},
              ${args.type ?? "short_text"}, 'required', ${args.maxLength ?? null}, ${args.conditionFieldId ?? null},
              ${args.conditionChoiceId ?? null}, 1)
    `;
    return id;
  };
  const insertChoice = async (
    fieldId: string,
    key: string,
    position: number,
  ) => {
    const id = randomUUID();
    await sql`
      INSERT INTO questionnaire_field_choices (id, field_id, key, position, version)
      VALUES (${id}, ${fieldId}, ${key}, ${position}, 1)
    `;
    return id;
  };
  await expectRejected(
    "onboarding field without requirement is rejected",
    () => sql`
      INSERT INTO questionnaire_fields (id, block_id, key, position, type, version)
      VALUES (${randomUUID()}, ${blockId}, ${smokeKey()}, 50, 'short_text', 1)
    `,
  );
  await expectRejected(
    "onboarding field without version is rejected",
    () => sql`
      INSERT INTO questionnaire_fields (id, block_id, key, position, type, requirement)
      VALUES (${randomUUID()}, ${blockId}, ${smokeKey()}, 50, 'short_text', 'required')
    `,
  );
  await expectRejected(
    "max length on a choice field is rejected",
    () => insertField({ position: 50, type: "choice", maxLength: 10 }),
    F.MaxLengthTypeCheck,
  );
  const triggerId = await insertField({ type: "yes_no" });
  const yesId = await insertChoice(triggerId, "yes", 0);
  const noId = await insertChoice(triggerId, "no", 1);
  await expectRejected(
    "a second field at the same position is rejected",
    () => insertField({ position: 0 }),
    F.PositionUnique,
  );
  await expectRejected(
    "a condition without its choice is rejected",
    () => insertField({ position: 1, conditionFieldId: triggerId }),
    F.ConditionPairCheck,
  );
  const groupId = await insertField({ position: 2, type: "group" });
  await expectRejected(
    "a group inside a group is rejected",
    () => insertField({ parentFieldId: groupId, type: "group" }),
    F.ParentTypeCheck,
  );
  await expectAccepted("sub-fields may reuse block-level positions", () =>
    insertField({ parentFieldId: groupId, position: 0 }),
  );
  const groupChoiceFieldId = await insertField({
    parentFieldId: groupId,
    position: 1,
    type: "choice",
  });
  const groupChoiceId = await insertChoice(groupChoiceFieldId, "only", 0);
  await expectRejected(
    "a condition naming a choice of another field is rejected",
    () =>
      insertField({
        position: 3,
        conditionFieldId: groupId,
        conditionChoiceId: yesId,
      }),
    F.ConditionChoiceForeignKey,
  );
  const dependentId = await insertField({
    position: 3,
    conditionFieldId: triggerId,
    conditionChoiceId: yesId,
  });
  await expectAccepted(
    "deleting the trigger choice clears the whole condition",
    async () => {
      await sql`DELETE FROM questionnaire_field_choices WHERE id = ${yesId}`;
      const [row] = (await sql`
        SELECT condition_field_id, condition_choice_id FROM questionnaire_fields WHERE id = ${dependentId}
      `) as {
        condition_field_id: string | null;
        condition_choice_id: string | null;
      }[];
      if (row?.condition_field_id !== null || row.condition_choice_id !== null)
        throw new Error("condition columns were not cleared together");
    },
  );

  await expectRejected(
    "field translation without label is rejected",
    () => sql`
      INSERT INTO questionnaire_field_translations (field_id, locale)
      VALUES (${triggerId}, 'de')
    `,
  );
  await expectRejected(
    "field choice without version is rejected",
    () => sql`
      INSERT INTO questionnaire_field_choices (id, field_id, key, position)
      VALUES (${randomUUID()}, ${triggerId}, 'maybe', 9)
    `,
  );
  await expectRejected(
    "choice translation without label is rejected",
    () => sql`
      INSERT INTO questionnaire_choice_translations (choice_id, locale)
      VALUES (${noId}, 'de')
    `,
  );

  const templateId = randomUUID();
  await expectRejected(
    "onboarding template without status is rejected",
    () => sql`
      INSERT INTO questionnaire_templates (id, title, version)
      VALUES (${randomUUID()}, ${name("Template")}, 1)
    `,
  );
  await expectRejected(
    "onboarding template without version is rejected",
    () => sql`
      INSERT INTO questionnaire_templates (id, title, status)
      VALUES (${randomUUID()}, ${name("Template")}, 'active')
    `,
  );
  await sql`
    INSERT INTO questionnaire_templates (id, title, status, version)
    VALUES (${templateId}, ${name("Template")}, 'active', 1)
  `;
  await expectRejected(
    "template block without position is rejected",
    () => sql`
      INSERT INTO questionnaire_template_blocks (template_id, block_id)
      VALUES (${templateId}, ${catalogBlockId})
    `,
  );
  await sql`
    INSERT INTO questionnaire_template_blocks (template_id, block_id, position)
    VALUES (${templateId}, ${catalogBlockId}, 0)
  `;
  await expectRejected(
    "a catalog block in use by a template cannot be deleted",
    () => sql`DELETE FROM questionnaire_blocks WHERE id = ${catalogBlockId}`,
  );

  type FormBlockArgs = {
    formId?: string;
    blockId?: string;
    reviewStatus?: string;
    clarificationMode?: string | null;
    reviewNote?: string | null;
  };
  const insertFormBlock = (args: FormBlockArgs = {}) => {
    const reviewStatus = args.reviewStatus ?? "pending";
    const reviewed = reviewStatus !== "pending";
    return sql`
      INSERT INTO onboarding_form_blocks (form_id, block_id, position, review_status, clarification_mode,
                                          review_note, reviewed_by_member_id, reviewed_at, version)
      VALUES (${args.formId ?? formId}, ${args.blockId ?? blockId}, 0, ${reviewStatus},
              ${args.clarificationMode ?? null}, ${args.reviewNote ?? null}, ${reviewed ? memberId : null},
              ${reviewed ? now : null}, 1)
    `;
  };
  await expectRejected(
    "form block without review status is rejected",
    () => sql`
      INSERT INTO onboarding_form_blocks (form_id, block_id, position, version)
      VALUES (${formId}, ${blockId}, 0, 1)
    `,
  );
  await expectRejected(
    "form block without version is rejected",
    () => sql`
      INSERT INTO onboarding_form_blocks (form_id, block_id, position, review_status)
      VALUES (${formId}, ${blockId}, 0, 'pending')
    `,
  );
  await expectRejected(
    "a catalog block as a form step is rejected",
    () => insertFormBlock({ blockId: catalogBlockId }),
    FB.BlockOwnerForeignKey,
  );
  await expectRejected(
    "a block of another form as a step is rejected",
    () => insertFormBlock({ formId: otherFormId }),
    FB.BlockOwnerForeignKey,
  );
  await expectRejected(
    "a clarification without a note is rejected",
    () =>
      insertFormBlock({
        reviewStatus: "clarification",
        clarificationMode: "customer",
        reviewNote: " ",
      }),
    FB.ClarificationNoteCheck,
  );
  await expectAccepted("a pending form step is accepted", () =>
    insertFormBlock(),
  );

  const entryId = randomUUID();
  await expectRejected(
    "group entry without position is rejected",
    () => sql`
      INSERT INTO onboarding_group_entries (id, form_id, field_id)
      VALUES (${randomUUID()}, ${formId}, ${groupId})
    `,
  );
  await sql`
    INSERT INTO onboarding_group_entries (id, form_id, field_id, position)
    VALUES (${entryId}, ${formId}, ${groupId}, 0)
  `;

  type AnswerArgs = {
    fieldId?: string;
    groupEntryId?: string | null;
    formId?: string;
    value?: string | null;
    choiceId?: string | null;
    sortOrder?: number;
  };
  const insertAnswer = (args: AnswerArgs = {}) => sql`
    INSERT INTO onboarding_answers (id, form_id, field_id, group_entry_id, choice_id, value, sort_order,
                                    updated_by_member_id)
    VALUES (${randomUUID()}, ${args.formId ?? formId}, ${args.fieldId ?? triggerId}, ${args.groupEntryId ?? null},
            ${args.choiceId ?? null}, ${args.value === undefined ? null : args.value}, ${args.sortOrder ?? 0},
            ${memberId})
  `;
  await expectRejected(
    "answer without sort order is rejected",
    () => sql`
      INSERT INTO onboarding_answers (id, form_id, field_id, choice_id)
      VALUES (${randomUUID()}, ${formId}, ${triggerId}, ${noId})
    `,
  );
  await expectRejected(
    "answer with value and choice is rejected",
    () => insertAnswer({ value: "yes", choiceId: noId }),
    A.ContentCheck,
  );
  await expectRejected(
    "answer without value and choice is rejected",
    () => insertAnswer(),
    A.ContentCheck,
  );
  await expectRejected(
    "answer with a choice of another field is rejected",
    () => insertAnswer({ fieldId: dependentId, choiceId: noId }),
    A.ChoiceFieldForeignKey,
  );
  await expectRejected(
    "answer with a blank value is rejected",
    () => insertAnswer({ fieldId: dependentId, value: "  " }),
    A.ValueCheck,
  );
  await expectRejected(
    "answer in a group entry of another form is rejected",
    () =>
      insertAnswer({
        fieldId: dependentId,
        value: "x",
        formId: otherFormId,
        groupEntryId: entryId,
      }),
    A.EntryFormForeignKey,
  );
  await insertAnswer({ choiceId: noId });
  await expectRejected(
    "the same choice cannot be answered twice in one field",
    () => insertAnswer({ choiceId: noId, sortOrder: 1 }),
    A.ChoiceBlockLevelUnique,
  );
  await expectRejected(
    "a second block-level answer in the same slot is rejected",
    () => insertAnswer({ choiceId: noId }),
    A.SlotUnique,
  );
  await insertAnswer({
    fieldId: groupChoiceFieldId,
    groupEntryId: entryId,
    choiceId: groupChoiceId,
  });
  await expectRejected(
    "the same choice cannot be answered twice in one group entry",
    () =>
      insertAnswer({
        fieldId: groupChoiceFieldId,
        groupEntryId: entryId,
        choiceId: groupChoiceId,
        sortOrder: 1,
      }),
    A.ChoiceGroupEntryUnique,
  );

  const fileId = randomUUID();
  await sql`
    INSERT INTO files (id, customer_id, source, status, asset_kind, display_name, visible_to_customer,
                       uploaded_by_side, uploaded_by_member_id, url, version)
    VALUES (${fileId}, ${customerId}, 'link', 'ready', 'link', ${name("Onboarding file")}, FALSE, 'internal',
            ${memberId}, 'https://example.test/logo', 1)
  `;
  await expectRejected(
    "answer file without position is rejected",
    () => sql`
      INSERT INTO onboarding_answer_files (id, form_id, field_id, file_id)
      VALUES (${randomUUID()}, ${formId}, ${dependentId}, ${fileId})
    `,
  );
  await expectAccepted("the same file on two fields is accepted", async () => {
    await sql`
      INSERT INTO onboarding_answer_files (id, form_id, field_id, file_id, position)
      VALUES (${randomUUID()}, ${formId}, ${dependentId}, ${fileId}, 0)
    `;
    await sql`
      INSERT INTO onboarding_answer_files (id, form_id, field_id, file_id, position)
      VALUES (${randomUUID()}, ${formId}, ${triggerId}, ${fileId}, 0)
    `;
  });

  await expectRejected(
    "form service without position is rejected",
    () => sql`
      INSERT INTO onboarding_form_services (id, form_id, title)
      VALUES (${randomUUID()}, ${formId}, 'Landingpage')
    `,
  );

  const insertFormTask = (args: {
    projectId?: string;
    formId: string;
    actionSide?: string;
    feedbackRoundId?: string;
  }) => sql`
    INSERT INTO tasks (id, project_id, title, description, status, action_side, visible_to_customer,
                       assignee_member_id, feedback_round_id, onboarding_form_id, version)
    VALUES (${randomUUID()}, ${args.projectId ?? projectId}, ${name("Onboarding task")}, '', 'open',
            ${args.actionSide ?? "internal"}, ${args.actionSide === "customer"}, ${memberId},
            ${args.feedbackRoundId ?? null}, ${args.formId}, 1)
  `;
  await expectRejected(
    "customer-side task with a form is rejected",
    () => insertFormTask({ formId, actionSide: "customer" }),
    TK.OnboardingFormSideCheck,
  );
  await expectRejected(
    "task with a form of another project is rejected",
    () => insertFormTask({ projectId: otherProjectId, formId }),
    TK.OnboardingFormProjectForeignKey,
  );
  const roundId = randomUUID();
  await sql`
    INSERT INTO feedback_rounds (id, project_id, customer_id, round_number, status, area_options,
                                 handed_over_by_member_id, handed_over_at, version)
    VALUES (${roundId}, ${projectId}, ${customerId}, 1, 'open', ARRAY ['Startseite'], ${memberId}, NOW(), 1)
  `;
  await expectRejected(
    "task that collects for a round and a form at once is rejected",
    () => insertFormTask({ formId, feedbackRoundId: roundId }),
    TK.SingleOriginCheck,
  );
  await expectAccepted("collecting task of a form is accepted", () =>
    insertFormTask({ formId }),
  );
  await expectRejected(
    "a second task for the same form is rejected",
    () => insertFormTask({ formId }),
    TK.OnboardingFormUnique,
  );
}

/** Runs before the customer cleanup, whose project cascade removes forms and their own blocks. */
export async function cleanupQuestionnaireFixtures(sql: Sql, pattern: string) {
  const keyPattern = `${ONBOARDING_SMOKE_KEY_PREFIX.replace(/_/g, "\\_")}%`;
  await sql`DELETE FROM questionnaire_templates WHERE title LIKE ${pattern}`;
  await sql`
    DELETE FROM questionnaire_blocks
    WHERE owner_form_id IS NULL AND key LIKE ${keyPattern}
  `;
}
