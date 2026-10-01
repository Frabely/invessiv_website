import { eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import {
  QuestionnaireFieldType,
  type QuestionnaireFieldType as FieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CreateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-field-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import {
  questionnaireBlocks,
  questionnaireFields,
  onboardingForms,
  questionnaireTemplates,
} from "@invessiv/db/record-configuration";
import { createQuestionnaireBlock } from "@/server/workspace/crm/command-handler/create-questionnaire-block.command-handler";
import { createQuestionnaireField } from "@/server/workspace/crm/command-handler/create-questionnaire-field.command-handler";
import { createQuestionnaireTemplate } from "@/server/workspace/crm/command-handler/create-questionnaire-template.command-handler";
import { deleteQuestionnaireBlock } from "@/server/workspace/crm/command-handler/delete-questionnaire-block.command-handler";
import { deleteQuestionnaireField } from "@/server/workspace/crm/command-handler/delete-questionnaire-field.command-handler";
import { duplicateQuestionnaireBlock } from "@/server/workspace/crm/command-handler/duplicate-questionnaire-block.command-handler";
import { moveQuestionnaireField } from "@/server/workspace/crm/command-handler/move-questionnaire-field.command-handler";
import { updateQuestionnaireBlock } from "@/server/workspace/crm/command-handler/update-questionnaire-block.command-handler";
import { updateQuestionnaireField } from "@/server/workspace/crm/command-handler/update-questionnaire-field.command-handler";
import { updateQuestionnaireTemplate } from "@/server/workspace/crm/command-handler/update-questionnaire-template.command-handler";
import { listQuestionnaireBlocks } from "@/server/workspace/crm/query-handler/list-questionnaire-blocks.query-handler";
import { questionnaireBlockCopyService } from "@/server/workspace/crm/services/questionnaire/questionnaire-block-copy-service";
import { questionnaireDefinitionReadService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-read-service";
import { createFileTestFixture } from "../../shared/files/file-test-fixture";

vi.mock("server-only", () => ({}));

const KEY_PREFIX = `itest_onb_${crypto.randomUUID().slice(0, 8)}`;
const TITLE_PREFIX = `integration:questionnaire:${KEY_PREFIX}`;

function value<T>(result: QuestionnaireCommandResult<T>): T {
  if (!result.ok) throw new Error(`expected success, got ${result.code}`);
  return result.value;
}

function fieldInput(
  key: string,
  type: FieldType,
  expectedBlockVersion: number,
  overrides: Partial<CreateQuestionnaireFieldRequestDto> = {},
): CreateQuestionnaireFieldRequestDto {
  return {
    key,
    type,
    parentFieldId: null,
    requirement: QuestionnaireFieldRequirement.Optional,
    maxLength: null,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    prefillSource: null,
    conditionFieldId: null,
    conditionChoiceId: null,
    translations: {
      de: { label: key, help: null },
      en: { label: key, help: null },
    },
    choices:
      type === QuestionnaireFieldType.YesNo
        ? [
            { key: "yes", labels: { de: "Ja", en: "Yes" } },
            { key: "no", labels: { de: "Nein", en: "No" } },
          ]
        : [],
    expectedBlockVersion,
    ...overrides,
  };
}

function fieldByKey(block: QuestionnaireBlockDto, key: string) {
  return block.fields
    .flatMap((field) => [field, ...field.children])
    .find((field) => field.key === key)!;
}

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "questionnaire catalog PostgreSQL integration",
  () => {
    const f = createFileTestFixture();
    let keySequence = 0;
    const nextKey = () => `${KEY_PREFIX}_${(keySequence += 1)}`;

    async function createBlock(): Promise<QuestionnaireBlockDto> {
      return value(
        await createQuestionnaireBlock({
          key: nextKey(),
          carryOver: true,
          translations: {
            de: { title: "Standorte", intro: null },
            en: { title: "Locations", intro: "Where to find you" },
          },
        }),
      );
    }

    /** Trigger, group with a conditioned sub-field pair, and a field shown on "yes". */
    async function createConditionedBlock(): Promise<QuestionnaireBlockDto> {
      let block = await createBlock();
      block = value(
        await createQuestionnaireField(
          block.id,
          fieldInput(
            "has_locations",
            QuestionnaireFieldType.YesNo,
            block.version,
          ),
        ),
      );
      const trigger = fieldByKey(block, "has_locations");
      const yes = trigger.choices.find((choice) => choice.key === "yes")!;
      block = value(
        await createQuestionnaireField(
          block.id,
          fieldInput("locations", QuestionnaireFieldType.Group, block.version, {
            requirement: QuestionnaireFieldRequirement.Required,
            minItems: 2,
            maxItems: 20,
            conditionFieldId: trigger.id,
            conditionChoiceId: yes.id,
          }),
        ),
      );
      const locations = fieldByKey(block, "locations");
      block = value(
        await createQuestionnaireField(
          block.id,
          fieldInput("is_open", QuestionnaireFieldType.YesNo, block.version, {
            parentFieldId: locations.id,
          }),
        ),
      );
      const isOpen = fieldByKey(block, "is_open");
      return value(
        await createQuestionnaireField(
          block.id,
          fieldInput(
            "opening_hours",
            QuestionnaireFieldType.LongText,
            block.version,
            {
              parentFieldId: locations.id,
              maxLength: 500,
              conditionFieldId: isOpen.id,
              conditionChoiceId: isOpen.choices[0]!.id,
            },
          ),
        ),
      );
    }

    let formId: string | undefined;
    /** One draft form on the fixture project, created on first use. */
    async function form(): Promise<string> {
      if (formId) return formId;
      formId = crypto.randomUUID();
      await f.database().insert(onboardingForms).values({
        id: formId,
        customer_id: f.customerId,
        project_id: f.projectId,
        source_template_id: null,
        status: OnboardingFormStatus.Draft,
        created_by_member_id: f.memberId,
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
      });
      return formId;
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      const db = f.database();
      if (db) {
        await db
          .delete(questionnaireTemplates)
          .where(like(questionnaireTemplates.title, `${TITLE_PREFIX}%`));
        // Form blocks go with their form, which goes with the project in the fixture cleanup.
        await db
          .delete(questionnaireBlocks)
          .where(like(questionnaireBlocks.key, `${KEY_PREFIX}%`));
      }
      await f.cleanup();
    }, 60_000);

    it("builds a block with a group and nested conditions and lists it", async () => {
      const block = await createConditionedBlock();

      expect(block.fields.map((field) => field.key)).toEqual([
        "has_locations",
        "locations",
      ]);
      expect(
        fieldByKey(block, "locations").children.map((child) => child.key),
      ).toEqual(["is_open", "opening_hours"]);
      expect(block.version).toBe(5);

      const list = await listQuestionnaireBlocks({
        status: "active",
        search: block.key,
      });
      expect(list.rows).toEqual([
        expect.objectContaining({
          id: block.id,
          fieldCount: 4,
          missingLocales: [],
          templateCount: 0,
        }),
      ]);
    });

    it("rejects a key that the catalog already uses", async () => {
      const block = await createBlock();
      expect(
        await createQuestionnaireBlock({
          key: block.key,
          carryOver: false,
          translations: { de: { title: "Doppelt", intro: null } },
        }),
      ).toEqual({ ok: false, code: QuestionnaireErrorCode.KeyTaken });
    });

    it("answers a stale block version with the current block and writes nothing", async () => {
      const block = await createBlock();
      const updated = value(
        await createQuestionnaireField(
          block.id,
          fieldInput("first", QuestionnaireFieldType.ShortText, block.version),
        ),
      );

      const stale = await createQuestionnaireField(
        block.id,
        fieldInput("second", QuestionnaireFieldType.ShortText, block.version),
      );

      expect(stale).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          currentVersion: updated.version,
          current: { id: block.id },
        },
      });
      const stored = await questionnaireDefinitionReadService.findBlock(
        f.database(),
        block.id,
        null,
      );
      expect(stored!.fields.map((field) => field.key)).toEqual(["first"]);
    });

    it("keeps an option that triggers a condition and a trigger with a dependent", async () => {
      let block = await createBlock();
      block = value(
        await createQuestionnaireField(
          block.id,
          fieldInput("channel", QuestionnaireFieldType.Choice, block.version, {
            choices: [
              { key: "email", labels: { de: "E-Mail" } },
              { key: "phone", labels: { de: "Telefon" } },
            ],
          }),
        ),
      );
      const channel = fieldByKey(block, "channel");
      block = value(
        await createQuestionnaireField(
          block.id,
          fieldInput(
            "phone_hours",
            QuestionnaireFieldType.ShortText,
            block.version,
            {
              conditionFieldId: channel.id,
              conditionChoiceId: channel.choices[1]!.id,
            },
          ),
        ),
      );

      expect(
        await updateQuestionnaireField(channel.id, {
          ...fieldInput(
            "channel",
            QuestionnaireFieldType.Choice,
            block.version,
          ),
          choices: [
            { key: "email", labels: { de: "E-Mail" } },
            { key: "fax", labels: { de: "Fax" } },
          ],
        }),
      ).toEqual({ ok: false, code: QuestionnaireErrorCode.InvalidCondition });

      const trigger = channel;
      expect(
        await deleteQuestionnaireField(trigger.id, {
          expectedBlockVersion: block.version,
        }),
      ).toEqual({ ok: false, code: QuestionnaireErrorCode.InvalidCondition });
      expect(
        await moveQuestionnaireField(trigger.id, {
          direction: 1,
          expectedBlockVersion: block.version,
        }),
      ).toEqual({ ok: false, code: QuestionnaireErrorCode.InvalidCondition });
    });

    it("keeps the fixed yes/no keys in their order", async () => {
      const block = await createConditionedBlock();
      const trigger = fieldByKey(block, "has_locations");
      expect(
        await updateQuestionnaireField(trigger.id, {
          ...fieldInput(
            "has_locations",
            QuestionnaireFieldType.YesNo,
            block.version,
          ),
          choices: [
            { key: "no", labels: { de: "Nein" } },
            { key: "yes", labels: { de: "Ja" } },
          ],
        }),
      ).toEqual({ ok: false, code: QuestionnaireErrorCode.InvalidFieldConfig });
    });

    it("relabels options without breaking the condition on them", async () => {
      const block = await createConditionedBlock();
      const trigger = fieldByKey(block, "has_locations");

      const updated = value(
        await updateQuestionnaireField(trigger.id, {
          ...fieldInput(
            "has_locations",
            QuestionnaireFieldType.YesNo,
            block.version,
          ),
          choices: [
            { key: "yes", labels: { de: "Ja, mehrere", en: "Yes, several" } },
            { key: "no", labels: { de: "Nur einen" } },
          ],
        }),
      );

      const relabelled = fieldByKey(updated, "has_locations");
      expect(relabelled.choices.map((choice) => choice.id)).toEqual(
        trigger.choices.map((choice) => choice.id),
      );
      expect(relabelled.choices[1]!.labels).toEqual({ de: "Nur einen" });
      expect(fieldByKey(updated, "locations").conditionChoiceId).toBe(
        trigger.choices[0]!.id,
      );
      expect(relabelled.version).toBe(trigger.version + 1);
    });

    it("swaps two neighbours atomically and closes the gap after a delete", async () => {
      let block = await createBlock();
      for (const key of ["alpha", "beta", "gamma"])
        block = value(
          await createQuestionnaireField(
            block.id,
            fieldInput(key, QuestionnaireFieldType.ShortText, block.version),
          ),
        );

      block = value(
        await moveQuestionnaireField(fieldByKey(block, "gamma").id, {
          direction: -1,
          expectedBlockVersion: block.version,
        }),
      );
      expect(block.fields.map((field) => [field.key, field.position])).toEqual([
        ["alpha", 0],
        ["gamma", 1],
        ["beta", 2],
      ]);

      const unchanged = value(
        await moveQuestionnaireField(fieldByKey(block, "alpha").id, {
          direction: -1,
          expectedBlockVersion: block.version,
        }),
      );
      expect(unchanged.version).toBe(block.version);

      block = value(
        await deleteQuestionnaireField(fieldByKey(block, "alpha").id, {
          expectedBlockVersion: block.version,
        }),
      );
      expect(block.fields.map((field) => [field.key, field.position])).toEqual([
        ["gamma", 0],
        ["beta", 1],
      ]);
    });

    it("duplicates a block with new ids and conditions on the copied fields", async () => {
      const source = await createConditionedBlock();
      const copyKey = nextKey();

      const copy = value(
        await duplicateQuestionnaireBlock(source.id, { key: copyKey }),
      );

      expect(copy).toMatchObject({
        key: copyKey,
        carryOver: true,
        status: QuestionnaireCatalogStatus.Active,
        sourceBlockId: null,
        translations: source.translations,
        version: 1,
      });
      const sourceIds = new Set(
        source.fields.flatMap((field) => [
          field.id,
          ...field.choices.map((choice) => choice.id),
          ...field.children.flatMap((child) => [
            child.id,
            ...child.choices.map((choice) => choice.id),
          ]),
        ]),
      );
      const copied = copy.fields.flatMap((field) => [field, ...field.children]);
      for (const field of copied) {
        expect(sourceIds.has(field.id)).toBe(false);
        for (const choice of field.choices)
          expect(sourceIds.has(choice.id)).toBe(false);
      }

      const trigger = fieldByKey(copy, "has_locations");
      const locations = fieldByKey(copy, "locations");
      const isOpen = fieldByKey(copy, "is_open");
      expect(locations.conditionFieldId).toBe(trigger.id);
      expect(locations.conditionChoiceId).toBe(trigger.choices[0]!.id);
      expect(fieldByKey(copy, "opening_hours")).toMatchObject({
        parentFieldId: locations.id,
        conditionFieldId: isOpen.id,
        conditionChoiceId: isOpen.choices[0]!.id,
        maxLength: 500,
        translations: fieldByKey(source, "opening_hours").translations,
      });
      expect(trigger.choices.map((choice) => choice.labels)).toEqual(
        fieldByKey(source, "has_locations").choices.map(
          (choice) => choice.labels,
        ),
      );
    });

    it("copies into a form inside the caller's transaction and remembers the origin", async () => {
      const source = await createConditionedBlock();
      const formId = await form();

      await expect(
        f.database().transaction(async (tx) => {
          await questionnaireBlockCopyService.copyBlock(tx, source, {
            ownerFormId: formId,
            key: source.key,
          });
          throw new Error("roll back");
        }),
      ).rejects.toThrow("roll back");
      const afterRollback = await f
        .database()
        .select({ id: questionnaireBlocks.id })
        .from(questionnaireBlocks)
        .where(eq(questionnaireBlocks.owner_form_id, formId));
      expect(afterRollback).toEqual([]);

      const copyId = await f.database().transaction((tx) =>
        questionnaireBlockCopyService.copyBlock(tx, source, {
          ownerFormId: formId,
          key: source.key,
        }),
      );
      const copy = await questionnaireDefinitionReadService.findBlock(
        f.database(),
        copyId,
        formId,
      );
      expect(copy).toMatchObject({ key: source.key, sourceBlockId: source.id });

      // The catalog endpoints never reach a form's block or its fields.
      const formField = fieldByKey(copy!, "has_locations");
      expect(
        await updateQuestionnaireField(formField.id, {
          ...fieldInput(
            "has_locations",
            QuestionnaireFieldType.YesNo,
            copy!.version,
          ),
        }),
      ).toEqual({ ok: false, code: QuestionnaireErrorCode.FieldNotFound });
      expect(
        await deleteQuestionnaireField(formField.id, {
          expectedBlockVersion: copy!.version,
        }),
      ).toEqual({ ok: false, code: QuestionnaireErrorCode.FieldNotFound });
      expect(
        await updateQuestionnaireBlock(copyId, {
          key: copy!.key,
          carryOver: false,
          status: QuestionnaireCatalogStatus.Active,
          translations: copy!.translations,
          version: copy!.version,
        }),
      ).toEqual({ ok: false, code: QuestionnaireErrorCode.BlockNotFound });

      // A later catalog change never reaches the copy.
      value(
        await updateQuestionnaireBlock(source.id, {
          key: source.key,
          carryOver: false,
          status: QuestionnaireCatalogStatus.Active,
          translations: { de: { title: "Geändert", intro: null } },
          version: source.version,
        }),
      );
      const untouched = await questionnaireDefinitionReadService.findBlock(
        f.database(),
        copyId,
        formId,
      );
      expect(untouched!.translations).toEqual(source.translations);
      expect(untouched!.carryOver).toBe(true);
    });

    it("refuses to delete a block in a template, archives it and keeps it in the template", async () => {
      const block = await createBlock();
      const spare = await createBlock();
      let template = value(
        await createQuestionnaireTemplate({
          title: `${TITLE_PREFIX} kompakt`,
          description: null,
        }),
      );
      template = value(
        await updateQuestionnaireTemplate(template.id, {
          title: template.title,
          description: "  ",
          status: QuestionnaireCatalogStatus.Active,
          blockIds: [block.id],
          version: template.version,
        }),
      );
      expect(template.description).toBeNull();

      expect(
        await deleteQuestionnaireBlock(block.id, { version: block.version }),
      ).toEqual({ ok: false, code: QuestionnaireErrorCode.BlockInUse });

      const archived = value(
        await updateQuestionnaireBlock(block.id, {
          key: block.key,
          carryOver: block.carryOver,
          status: QuestionnaireCatalogStatus.Archived,
          translations: block.translations,
          version: block.version,
        }),
      );
      expect(archived.status).toBe(QuestionnaireCatalogStatus.Archived);

      const kept = value(
        await updateQuestionnaireTemplate(template.id, {
          title: template.title,
          description: null,
          status: QuestionnaireCatalogStatus.Active,
          blockIds: [spare.id, block.id],
          version: template.version,
        }),
      );
      expect(kept.blocks).toEqual([
        { blockId: spare.id, position: 0 },
        { blockId: block.id, position: 1 },
      ]);

      const archivedSpare = value(
        await updateQuestionnaireBlock(spare.id, {
          key: spare.key,
          carryOver: spare.carryOver,
          status: QuestionnaireCatalogStatus.Archived,
          translations: spare.translations,
          version: spare.version,
        }),
      );
      const fresh = await createBlock();
      value(
        await updateQuestionnaireTemplate(template.id, {
          title: template.title,
          description: null,
          status: QuestionnaireCatalogStatus.Active,
          blockIds: [fresh.id],
          version: kept.version,
        }),
      );
      expect(
        await updateQuestionnaireTemplate(template.id, {
          title: template.title,
          description: null,
          status: QuestionnaireCatalogStatus.Active,
          blockIds: [fresh.id, archivedSpare.id],
          version: kept.version + 1,
        }),
      ).toMatchObject({
        ok: false,
        code: QuestionnaireErrorCode.ValidationError,
      });

      const unused = await createBlock();
      expect(
        value(
          await deleteQuestionnaireBlock(unused.id, {
            version: unused.version,
          }),
        ).id,
      ).toBe(unused.id);
      expect(
        await questionnaireDefinitionReadService.findBlock(
          f.database(),
          unused.id,
          null,
        ),
      ).toBeNull();
    });

    it("refuses a block of a form in a template", async () => {
      const source = await createBlock();
      const formBlockId = await f.database().transaction(async (tx) =>
        questionnaireBlockCopyService.copyBlock(tx, source, {
          ownerFormId: await form(),
          key: source.key,
        }),
      );
      const template = value(
        await createQuestionnaireTemplate({
          title: `${TITLE_PREFIX} fremd`,
          description: null,
        }),
      );
      expect(
        await updateQuestionnaireTemplate(template.id, {
          title: template.title,
          description: null,
          status: QuestionnaireCatalogStatus.Active,
          blockIds: [formBlockId],
          version: template.version,
        }),
      ).toEqual({ ok: false, code: QuestionnaireErrorCode.BlockNotFound });
    });

    it("stores the catalog fields with positions that stay dense", async () => {
      const block = await createConditionedBlock();
      const rows = await f
        .database()
        .select({ position: questionnaireFields.position })
        .from(questionnaireFields)
        .where(
          inArray(
            questionnaireFields.id,
            block.fields.map((field) => field.id),
          ),
        );
      expect(rows.map((row) => row.position).sort()).toEqual([0, 1]);
    });
  },
);
