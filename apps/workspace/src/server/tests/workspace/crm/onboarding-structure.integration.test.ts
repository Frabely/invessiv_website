import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import {
  files,
  onboardingAnswerFiles,
  onboardingAnswers,
  onboardingFormBlocks,
  onboardingGroupEntries,
  questionnaireBlocks,
  questionnaireFields,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { addOnboardingFormBlock } from "@/server/workspace/crm/command-handler/add-onboarding-form-block.command-handler";
import { createOnboardingFormField } from "@/server/workspace/crm/command-handler/create-onboarding-form-field.command-handler";
import { deleteOnboardingFormField } from "@/server/workspace/crm/command-handler/delete-onboarding-form-field.command-handler";
import { moveOnboardingFormBlock } from "@/server/workspace/crm/command-handler/move-onboarding-form-block.command-handler";
import { moveOnboardingFormField } from "@/server/workspace/crm/command-handler/move-onboarding-form-field.command-handler";
import { removeOnboardingFormBlock } from "@/server/workspace/crm/command-handler/remove-onboarding-form-block.command-handler";
import { startProjectOnboarding } from "@/server/workspace/crm/command-handler/start-project-onboarding.command-handler";
import { updateOnboardingFormBlock } from "@/server/workspace/crm/command-handler/update-onboarding-form-block.command-handler";
import { updateOnboardingFormField } from "@/server/workspace/crm/command-handler/update-onboarding-form-field.command-handler";
import { updateQuestionnaireBlock } from "@/server/workspace/crm/command-handler/update-questionnaire-block.command-handler";
import { getOnboardingFieldUsage } from "@/server/workspace/crm/query-handler/get-onboarding-field-usage.query-handler";
import { getOnboardingForm } from "@/server/workspace/crm/query-handler/get-onboarding-form.query-handler";
import { questionnaireDefinitionReadService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";
import { createOnboardingIntegrationFixture } from "./support/onboarding-integration-fixture";
import {
  fieldByKey,
  fieldRequestFixture,
  updateFieldRequestFixture,
} from "./support/questionnaire-definition-fixtures";

vi.mock("server-only", () => ({}));
// Every test talks to the development database several dozen times.
vi.setConfig({ testTimeout: 60_000 });

const FORM_NOT_FOUND = { ok: false, code: OnboardingErrorCode.FormNotFound };
const NOT_EDITABLE = { ok: false, code: OnboardingErrorCode.NotEditable };

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "onboarding structure PostgreSQL integration",
  () => {
    const f = createOnboardingIntegrationFixture();

    /** A draft with one copied block (`name`, `logo`, group `team` with `member_name`). */
    async function draft(projectId?: string) {
      const source = await f.catalogBlock([
        { key: "name", type: T.ShortText },
        { key: "logo", type: T.Files },
        { key: "team", type: T.Group },
        { key: "member_name", type: T.ShortText, parent: "team" },
      ]);
      const form = f.value(
        await startProjectOnboarding(
          projectId ?? (await f.project()),
          { templateId: (await f.template([source.id])).id },
          f.member(),
        ),
      );
      return { form, source, block: form.blocks[0]!.block };
    }

    async function reread(formId: string): Promise<OnboardingFormDto> {
      return (await getOnboardingForm(formId, f.member()))!;
    }

    const ownBlock = (key: string, expectedFormVersion: number) => ({
      key,
      translations: { de: { title: "Eigener Baustein", intro: null } },
      expectedFormVersion,
    });

    /** Every structure command against one form, block and field, for the rejection tests. */
    function commands(
      form: OnboardingFormDto,
      actor: WorkspaceActor,
      catalogBlockId: string,
    ) {
      const block = form.blocks[0]!.block;
      const field = fieldByKey(block, "name");
      const expectedFormVersion = form.version;
      return [
        () =>
          addOnboardingFormBlock(
            form.id,
            { catalogBlockId, expectedFormVersion },
            actor,
          ),
        () =>
          addOnboardingFormBlock(
            form.id,
            ownBlock(`${f.keyPrefix}_own`, expectedFormVersion),
            actor,
          ),
        () =>
          moveOnboardingFormBlock(
            form.id,
            block.id,
            { direction: 1, expectedFormVersion },
            actor,
          ),
        () =>
          removeOnboardingFormBlock(
            form.id,
            block.id,
            { expectedFormVersion },
            actor,
          ),
        () =>
          updateOnboardingFormBlock(
            form.id,
            block.id,
            {
              key: block.key,
              carryOver: false,
              status: QuestionnaireCatalogStatus.Active,
              translations: { de: { title: "Neu", intro: null } },
              version: block.version,
            },
            actor,
          ),
        () =>
          createOnboardingFormField(
            form.id,
            block.id,
            fieldRequestFixture("extra", T.ShortText, block.version),
            actor,
          ),
        () =>
          updateOnboardingFormField(
            form.id,
            field.id,
            updateFieldRequestFixture("renamed", T.ShortText, block.version),
            actor,
          ),
        () =>
          moveOnboardingFormField(
            form.id,
            field.id,
            { direction: 1, expectedBlockVersion: block.version },
            actor,
          ),
        () =>
          deleteOnboardingFormField(
            form.id,
            field.id,
            { expectedBlockVersion: block.version },
            actor,
          ),
      ];
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
    }, 60_000);

    describe("block list", () => {
      it("appends a copy of a catalog block as the last pending step", async () => {
        const { form, source } = await draft();
        const extra = await f.catalogBlock([
          { key: "claim", type: T.LongText },
        ]);

        const updated = f.value(
          await addOnboardingFormBlock(
            form.id,
            { catalogBlockId: extra.id, expectedFormVersion: form.version },
            f.member(),
          ),
        );

        expect(updated.version).toBe(form.version + 1);
        expect(
          updated.blocks.map((step) => [
            step.position,
            step.reviewStatus,
            step.block.sourceBlockId,
          ]),
        ).toEqual([
          [0, OnboardingBlockReviewStatus.Pending, source.id],
          [1, OnboardingBlockReviewStatus.Pending, extra.id],
        ]);
        expect(
          updated.blocks[1]!.block.fields.map((field) => field.key),
        ).toEqual(["claim"]);
        expect(await reread(form.id)).toEqual(updated);
      });

      it("pre-fills an added carry-over block from the last completed form", async () => {
        const carried = await f.catalogBlock(
          [{ key: "slogan", type: T.ShortText }],
          { carryOver: true },
        );
        const previous = f.value(
          await startProjectOnboarding(
            await f.project(),
            { templateId: (await f.template([carried.id])).id },
            f.member(),
          ),
        );
        await f.answer(
          previous,
          fieldByKey(previous.blocks[0]!.block, "slogan").id,
          { value: "Klar und nah" },
        );
        await f.setFormStatus(previous.id, OnboardingFormStatus.Completed);
        const { form } = await draft();

        const updated = f.value(
          await addOnboardingFormBlock(
            form.id,
            { catalogBlockId: carried.id, expectedFormVersion: form.version },
            f.member(),
          ),
        );

        expect(updated.answers).toEqual([
          expect.objectContaining({
            fieldId: fieldByKey(updated.blocks[1]!.block, "slogan").id,
            value: "Klar und nah",
          }),
        ]);
      });

      it("refuses the same catalog block twice, an archived one and blocks that are no catalog blocks", async () => {
        const { form, source, block } = await draft();
        const add = (catalogBlockId: string) =>
          addOnboardingFormBlock(
            form.id,
            { catalogBlockId, expectedFormVersion: form.version },
            f.member(),
          );
        expect(await add(source.id)).toEqual({
          ok: false,
          code: QuestionnaireErrorCode.KeyTaken,
        });

        const archived = await f.catalogBlock();
        f.value(
          await updateQuestionnaireBlock(archived.id, {
            key: archived.key,
            carryOver: archived.carryOver,
            status: QuestionnaireCatalogStatus.Archived,
            translations: archived.translations,
            version: archived.version,
          }),
        );
        for (const id of [archived.id, block.id, crypto.randomUUID()])
          expect(await add(id)).toEqual({
            ok: false,
            code: QuestionnaireErrorCode.BlockNotFound,
          });
        expect((await reread(form.id)).version).toBe(form.version);
      });

      it("creates an own block without origin that is never company-wide", async () => {
        const { form } = await draft();
        const key = `${f.keyPrefix}_own_a`;

        const updated = f.value(
          await addOnboardingFormBlock(
            form.id,
            ownBlock(key, form.version),
            f.member(),
          ),
        );

        expect(updated.blocks[1]).toMatchObject({
          position: 1,
          block: {
            key,
            sourceBlockId: null,
            carryOver: false,
            fields: [],
            translations: { de: { title: "Eigener Baustein", intro: null } },
          },
        });
        expect(
          await addOnboardingFormBlock(
            form.id,
            ownBlock(key, updated.version),
            f.member(),
          ),
        ).toEqual({ ok: false, code: QuestionnaireErrorCode.KeyTaken });
        // The key is only taken within this form: the catalog does not know it.
        expect(
          await questionnaireDefinitionReadService.isBlockKeyTaken(
            f.database(),
            null,
            key,
          ),
        ).toBe(false);
      });

      it("stops at the block limit", async () => {
        const form = f.value(
          await startProjectOnboarding(
            await f.project(),
            { templateId: null },
            f.member(),
          ),
        );
        const blocks = Array.from(
          { length: QUESTIONNAIRE_LIMITS.blocksPerOwner },
          (_, position) => ({ id: crypto.randomUUID(), position }),
        );
        await f
          .database()
          .insert(questionnaireBlocks)
          .values(
            blocks.map((block) => ({
              id: block.id,
              owner_form_id: form.id,
              source_block_id: null,
              key: `${f.keyPrefix}_limit_${block.position}`,
              carry_over: false,
              status: QuestionnaireCatalogStatus.Active,
              version: 1,
            })),
          );
        await f
          .database()
          .insert(onboardingFormBlocks)
          .values(
            blocks.map((block) => ({
              form_id: form.id,
              block_id: block.id,
              position: block.position,
              review_status: OnboardingBlockReviewStatus.Pending,
              clarification_mode: null,
              review_note: null,
              reviewed_by_member_id: null,
              reviewed_at: null,
              version: 1,
            })),
          );

        expect(
          await addOnboardingFormBlock(
            form.id,
            ownBlock(`${f.keyPrefix}_one_more`, form.version),
            f.member(),
          ),
        ).toEqual({ ok: false, code: QuestionnaireErrorCode.LimitReached });
      });

      it("moves a block one step and leaves the ends alone", async () => {
        const { form, block } = await draft();
        const withSecond = f.value(
          await addOnboardingFormBlock(
            form.id,
            ownBlock(`${f.keyPrefix}_second`, form.version),
            f.member(),
          ),
        );
        const second = withSecond.blocks[1]!.block;

        const moved = f.value(
          await moveOnboardingFormBlock(
            form.id,
            second.id,
            { direction: -1, expectedFormVersion: withSecond.version },
            f.member(),
          ),
        );
        expect(
          moved.blocks.map((step) => [step.position, step.block.id]),
        ).toEqual([
          [0, second.id],
          [1, block.id],
        ]);

        const atEdge = f.value(
          await moveOnboardingFormBlock(
            form.id,
            second.id,
            { direction: -1, expectedFormVersion: moved.version },
            f.member(),
          ),
        );
        expect(atEdge.blocks.map((step) => step.block.id)).toEqual([
          second.id,
          block.id,
        ]);
      });

      it("removes a block with its definition, answers and links but keeps the files", async () => {
        const { form, block } = await draft();
        const withSecond = f.value(
          await addOnboardingFormBlock(
            form.id,
            ownBlock(`${f.keyPrefix}_kept`, form.version),
            f.member(),
          ),
        );
        await f.answer(form, fieldByKey(block, "name").id, { value: "Anna" });
        const entry = await f.groupEntry(form, fieldByKey(block, "team").id, 0);
        await f.answer(form, fieldByKey(block, "member_name").id, {
          value: "Ben",
          groupEntryId: entry,
        });
        const fileId = await f.answerFile(
          form,
          fieldByKey(block, "logo").id,
          0,
        );

        const updated = f.value(
          await removeOnboardingFormBlock(
            form.id,
            block.id,
            { expectedFormVersion: withSecond.version },
            f.member(),
          ),
        );

        expect(
          updated.blocks.map((step) => [step.position, step.block.key]),
        ).toEqual([[0, `${f.keyPrefix}_kept`]]);
        expect(updated).toMatchObject({
          answers: [],
          groupEntries: [],
          answerFiles: [],
        });
        const db = f.database();
        for (const table of [
          onboardingAnswers,
          onboardingGroupEntries,
          onboardingAnswerFiles,
        ])
          expect(
            await db.select().from(table).where(eq(table.form_id, form.id)),
          ).toEqual([]);
        expect(
          await db
            .select()
            .from(questionnaireFields)
            .where(eq(questionnaireFields.block_id, block.id)),
        ).toEqual([]);
        expect(
          await db.select().from(files).where(eq(files.id, fileId)),
        ).toHaveLength(1);
      });

      it("answers a stale form version with the current form and changes nothing", async () => {
        const { form, block } = await draft();
        const current = f.value(
          await addOnboardingFormBlock(
            form.id,
            ownBlock(`${f.keyPrefix}_fresh`, form.version),
            f.member(),
          ),
        );
        const conflict = {
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          conflict: {
            code: ConcurrencyErrorCode.VersionConflict,
            currentVersion: current.version,
            current,
          },
        };
        const stale = { expectedFormVersion: form.version };

        expect(
          await addOnboardingFormBlock(
            form.id,
            ownBlock(`${f.keyPrefix}_stale`, form.version),
            f.member(),
          ),
        ).toEqual(conflict);
        expect(
          await moveOnboardingFormBlock(
            form.id,
            block.id,
            { direction: 1, ...stale },
            f.member(),
          ),
        ).toEqual(conflict);
        expect(
          await removeOnboardingFormBlock(form.id, block.id, stale, f.member()),
        ).toEqual(conflict);
        expect(await reread(form.id)).toEqual(current);
      });
    });

    describe("blocks and fields of a form", () => {
      it("edits head and fields through the shared definition service and bumps the form", async () => {
        const { form, source, block } = await draft();

        let current = f.value(
          await updateOnboardingFormBlock(
            form.id,
            block.id,
            {
              key: block.key,
              carryOver: block.carryOver,
              // A form block is never archived, whatever the request says.
              status: QuestionnaireCatalogStatus.Archived,
              translations: {
                de: { title: "Für dieses Projekt", intro: null },
              },
              version: block.version,
            },
            f.member(),
          ),
        );
        expect(current).toMatchObject({
          status: QuestionnaireCatalogStatus.Active,
          translations: { de: { title: "Für dieses Projekt", intro: null } },
        });

        current = f.value(
          await createOnboardingFormField(
            form.id,
            block.id,
            fieldRequestFixture("claim", T.LongText, current.version),
            f.member(),
          ),
        );
        current = f.value(
          await updateOnboardingFormField(
            form.id,
            fieldByKey(current, "claim").id,
            updateFieldRequestFixture("tagline", T.LongText, current.version),
            f.member(),
          ),
        );
        current = f.value(
          await moveOnboardingFormField(
            form.id,
            fieldByKey(current, "tagline").id,
            { direction: -1, expectedBlockVersion: current.version },
            f.member(),
          ),
        );
        current = f.value(
          await deleteOnboardingFormField(
            form.id,
            fieldByKey(current, "name").id,
            { expectedBlockVersion: current.version },
            f.member(),
          ),
        );

        expect(current.fields.map((field) => field.key)).toEqual([
          "logo",
          "tagline",
          "team",
        ]);
        const stored = await reread(form.id);
        expect(stored.blocks[0]!.block).toEqual(current);
        expect(stored.version).toBe(form.version + 5);
        expect(
          await questionnaireDefinitionReadService.findBlock(
            f.database(),
            source.id,
            null,
          ),
        ).toEqual(source);
      });

      it("answers a stale block version with the current block", async () => {
        const { form, block } = await draft();
        const current = f.value(
          await createOnboardingFormField(
            form.id,
            block.id,
            fieldRequestFixture("first", T.ShortText, block.version),
            f.member(),
          ),
        );

        expect(
          await createOnboardingFormField(
            form.id,
            block.id,
            fieldRequestFixture("second", T.ShortText, block.version),
            f.member(),
          ),
        ).toEqual({
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          conflict: {
            code: ConcurrencyErrorCode.VersionConflict,
            currentVersion: current.version,
            current,
          },
        });
        // A refused write leaves the form version alone.
        expect((await reread(form.id)).version).toBe(form.version + 1);
      });

      it("treats blocks and fields of the catalog or of another form as missing", async () => {
        const { form, source } = await draft();
        const other = await draft();
        const blockNotFound = {
          ok: false,
          code: QuestionnaireErrorCode.BlockNotFound,
        };
        const fieldNotFound = {
          ok: false,
          code: QuestionnaireErrorCode.FieldNotFound,
        };

        for (const foreign of [source, other.block]) {
          const field = fieldByKey(foreign, "name");
          expect(
            await updateOnboardingFormBlock(
              form.id,
              foreign.id,
              {
                key: foreign.key,
                carryOver: false,
                status: QuestionnaireCatalogStatus.Active,
                translations: foreign.translations,
                version: foreign.version,
              },
              f.member(),
            ),
          ).toEqual(blockNotFound);
          expect(
            await createOnboardingFormField(
              form.id,
              foreign.id,
              fieldRequestFixture("extra", T.ShortText, foreign.version),
              f.member(),
            ),
          ).toEqual(blockNotFound);
          expect(
            await removeOnboardingFormBlock(
              form.id,
              foreign.id,
              { expectedFormVersion: form.version },
              f.member(),
            ),
          ).toEqual(blockNotFound);
          expect(
            await moveOnboardingFormBlock(
              form.id,
              foreign.id,
              { direction: 1, expectedFormVersion: form.version },
              f.member(),
            ),
          ).toEqual(blockNotFound);
          expect(
            await updateOnboardingFormField(
              form.id,
              field.id,
              updateFieldRequestFixture("x1", T.ShortText, foreign.version),
              f.member(),
            ),
          ).toEqual(fieldNotFound);
          expect(
            await moveOnboardingFormField(
              form.id,
              field.id,
              { direction: 1, expectedBlockVersion: foreign.version },
              f.member(),
            ),
          ).toEqual(fieldNotFound);
          expect(
            await deleteOnboardingFormField(
              form.id,
              field.id,
              { expectedBlockVersion: foreign.version },
              f.member(),
            ),
          ).toEqual(fieldNotFound);
          expect(
            await getOnboardingFieldUsage(form.id, field.id, f.member()),
          ).toBeNull();
        }
        expect((await reread(form.id)).version).toBe(form.version);
        expect(await reread(other.form.id)).toEqual(other.form);
      });

      it("counts the answers and files a field delete would take along", async () => {
        const { form, block } = await draft();
        const field = (key: string) => fieldByKey(block, key);
        await f.answer(form, field("name").id, { value: "Anna" });
        await f.answerFile(form, field("logo").id, 0);
        await f.answerFile(form, field("logo").id, 1);
        for (const [position, name] of ["Ben", "Cem"].entries())
          await f.answer(form, field("member_name").id, {
            value: name,
            groupEntryId: await f.groupEntry(form, field("team").id, position),
          });
        // An entry nobody has filled in yet is lost with its group all the same.
        await f.groupEntry(form, field("team").id, 2);

        const usage = (key: string) =>
          getOnboardingFieldUsage(form.id, field(key).id, f.member());
        expect(await usage("name")).toEqual({
          answers: 1,
          files: 0,
          entries: 0,
        });
        expect(await usage("logo")).toEqual({
          answers: 0,
          files: 2,
          entries: 0,
        });
        expect(await usage("team")).toEqual({
          answers: 2,
          files: 0,
          entries: 3,
        });
        expect(await usage("member_name")).toEqual({
          answers: 2,
          files: 0,
          entries: 0,
        });

        const fileIds = (
          await f
            .database()
            .select({ id: onboardingAnswerFiles.file_id })
            .from(onboardingAnswerFiles)
            .where(eq(onboardingAnswerFiles.form_id, form.id))
        ).map((row) => row.id);
        f.value(
          await deleteOnboardingFormField(
            form.id,
            field("logo").id,
            { expectedBlockVersion: block.version },
            f.member(),
          ),
        );
        expect((await reread(form.id)).answerFiles).toEqual([]);
        expect(
          await f
            .database()
            .select()
            .from(files)
            .where(inArray(files.id, fileIds)),
        ).toHaveLength(2);
      });
    });

    describe("status and access", () => {
      it.each([
        OnboardingFormStatus.Submitted,
        OnboardingFormStatus.ChangesRequested,
        OnboardingFormStatus.Completed,
      ])("locks the structure of a %s form", async (status) => {
        const { form } = await draft();
        const extra = await f.catalogBlock();
        await f.setFormStatus(form.id, status);

        for (const run of commands(form, f.member(), extra.id))
          expect(await run()).toEqual(NOT_EDITABLE);
        expect((await reread(form.id)).blocks).toEqual(form.blocks);
      });

      it("still allows structure changes while the form is open", async () => {
        const { form, block } = await draft();
        await f.setFormStatus(form.id, OnboardingFormStatus.Open);

        expect(
          await createOnboardingFormField(
            form.id,
            block.id,
            fieldRequestFixture("extra", T.ShortText, block.version),
            f.member(),
          ),
        ).toMatchObject({ ok: true });
      });

      it("gives a member without files.read the slot of an attached file, not the file", async () => {
        const { form, block } = await draft();
        const logo = fieldByKey(block, "logo");
        await f.answerFile(form, logo.id, 0);

        expect(
          await getOnboardingForm(form.id, f.member([Permission.ProjectsRead])),
        ).toMatchObject({
          answerFiles: [],
          hiddenAnswerFiles: [{ fieldId: logo.id, groupEntryId: null }],
        });
        expect(await reread(form.id)).toMatchObject({
          answerFiles: [{ fieldId: logo.id }],
          hiddenAnswerFiles: [],
        });
      });

      it("keeps an option of a released form that already has an answer", async () => {
        const option = (key: string) => ({ key, labels: { de: key } });
        const source = await f.catalogBlock([
          {
            key: "kind",
            type: T.Choice,
            overrides: { choices: ["a", "b", "c"].map(option) },
          },
        ]);
        const form = f.value(
          await startProjectOnboarding(
            await f.project(),
            { templateId: (await f.template([source.id])).id },
            f.member(),
          ),
        );
        const block = form.blocks[0]!.block;
        const kind = fieldByKey(block, "kind");
        const chosen = kind.choices.find((choice) => choice.key === "b")!;
        await f.setFormStatus(form.id, OnboardingFormStatus.Open);
        await f.answer(form, kind.id, { choiceId: chosen.id });
        const update = (keys: string[], version: number) =>
          updateOnboardingFormField(
            form.id,
            kind.id,
            updateFieldRequestFixture("kind", T.Choice, version, {
              choices: keys.map(option),
            }),
            f.member(),
          );

        // Dropping the option and giving it another key both delete the stored row.
        for (const keys of [
          ["a", "c"],
          ["a", "b_renamed", "c"],
        ])
          expect(await update(keys, block.version)).toEqual({
            ok: false,
            code: QuestionnaireErrorCode.ChoiceInUse,
          });
        expect((await reread(form.id)).answers).toHaveLength(1);

        expect(await update(["a", "b"], block.version)).toMatchObject({
          ok: true,
        });
        expect((await reread(form.id)).answers).toHaveLength(1);
      });

      it("lets a draft drop an option together with its pre-filled answer", async () => {
        const option = (key: string) => ({ key, labels: { de: key } });
        const source = await f.catalogBlock([
          {
            key: "kind",
            type: T.Choice,
            overrides: { choices: ["a", "b", "c"].map(option) },
          },
        ]);
        const form = f.value(
          await startProjectOnboarding(
            await f.project(),
            { templateId: (await f.template([source.id])).id },
            f.member(),
          ),
        );
        const block = form.blocks[0]!.block;
        const kind = fieldByKey(block, "kind");
        await f.answer(form, kind.id, {
          choiceId: kind.choices.find((choice) => choice.key === "b")!.id,
        });

        expect(
          await updateOnboardingFormField(
            form.id,
            kind.id,
            updateFieldRequestFixture("kind", T.Choice, block.version, {
              choices: ["a", "c"].map(option),
            }),
            f.member(),
          ),
        ).toMatchObject({ ok: true });
        expect((await reread(form.id)).answers).toEqual([]);
      });

      it("never lets a released form lose the last field of a block or of a group", async () => {
        const { form, block } = await draft();
        await f.setFormStatus(form.id, OnboardingFormStatus.Open);
        const remove = (key: string, version: number) =>
          deleteOnboardingFormField(
            form.id,
            fieldByKey(block, key).id,
            { expectedBlockVersion: version },
            f.member(),
          );
        const lastField = { ok: false, code: QuestionnaireErrorCode.LastField };

        expect(await remove("member_name", block.version)).toEqual(lastField);
        const withoutLogo = f.value(await remove("logo", block.version));
        const withoutTeam = f.value(await remove("team", withoutLogo.version));
        expect(await remove("name", withoutTeam.version)).toEqual(lastField);
        expect(
          (await reread(form.id)).blocks[0]!.block.fields.map(
            (field) => field.key,
          ),
        ).toEqual(["name"]);
      });

      it("lets a draft lose every field of a block", async () => {
        const { form, block } = await draft();

        expect(
          await deleteOnboardingFormField(
            form.id,
            fieldByKey(block, "member_name").id,
            { expectedBlockVersion: block.version },
            f.member(),
          ),
        ).toMatchObject({ ok: true });
      });

      it("never lets a released form lose the last block that asks something", async () => {
        const { form, block } = await draft();
        const withEmpty = f.value(
          await addOnboardingFormBlock(
            form.id,
            ownBlock(`${f.keyPrefix}_empty`, form.version),
            f.member(),
          ),
        );
        await f.setFormStatus(form.id, OnboardingFormStatus.Open);

        expect(
          await removeOnboardingFormBlock(
            form.id,
            block.id,
            { expectedFormVersion: withEmpty.version },
            f.member(),
          ),
        ).toEqual({ ok: false, code: OnboardingErrorCode.EmptyForm });

        const empty = withEmpty.blocks[1]!.block;
        const withoutEmpty = f.value(
          await removeOnboardingFormBlock(
            form.id,
            empty.id,
            { expectedFormVersion: withEmpty.version },
            f.member(),
          ),
        );
        expect(withoutEmpty.blocks.map((step) => step.block.id)).toEqual([
          block.id,
        ]);
      });

      it("hides the form from foreign customers, other projects and read-only members", async () => {
        const { form } = await draft();
        const foreign = await draft(
          await f.project({ customerId: f.foreignCustomerId }),
        );
        const extra = await f.catalogBlock();
        const write = new Set([
          Permission.ProjectsRead,
          Permission.ProjectsWrite,
        ]);
        const customerBound = f.actor({
          permissions: new Set(),
          customerPermissions: new Map([[f.customerId, write]]),
        });
        const projectBound = f.actor({
          permissions: new Set(),
          projectPermissions: new Map([
            [
              f.siblingProjectId,
              { customerId: f.customerId, permissions: write },
            ],
          ]),
        });
        const reader = f.member([Permission.ProjectsRead]);

        for (const [target, actor] of [
          [foreign.form, customerBound],
          [form, projectBound],
          [form, reader],
        ] as const) {
          for (const run of commands(target, actor, extra.id))
            expect(await run()).toEqual(FORM_NOT_FOUND);
        }
        const field = fieldByKey(form.blocks[0]!.block, "name");
        expect(
          await getOnboardingFieldUsage(form.id, field.id, projectBound),
        ).toBeNull();
        expect(
          await getOnboardingFieldUsage(
            foreign.form.id,
            fieldByKey(foreign.block, "name").id,
            customerBound,
          ),
        ).toBeNull();
        expect(
          await getOnboardingFieldUsage(form.id, field.id, reader),
        ).toEqual({ answers: 0, files: 0, entries: 0 });
        expect(await reread(form.id)).toEqual(form);
        expect(await reread(foreign.form.id)).toEqual(foreign.form);
      });

      it("rejects malformed ids and bodies without touching the form", async () => {
        const { form, block } = await draft();
        expect(
          await addOnboardingFormBlock(
            "not-a-uuid",
            ownBlock("some_key", 1),
            f.member(),
          ),
        ).toEqual(FORM_NOT_FOUND);
        expect(
          await addOnboardingFormBlock(
            form.id,
            { catalogBlockId: "not-a-uuid", expectedFormVersion: form.version },
            f.member(),
          ),
        ).toMatchObject({
          ok: false,
          code: OnboardingErrorCode.ValidationError,
        });
        expect(
          await moveOnboardingFormBlock(
            form.id,
            block.id,
            { direction: 2 as 1, expectedFormVersion: form.version },
            f.member(),
          ),
        ).toMatchObject({
          ok: false,
          code: OnboardingErrorCode.ValidationError,
        });
        expect(
          await removeOnboardingFormBlock(
            form.id,
            "not-a-uuid",
            { expectedFormVersion: form.version },
            f.member(),
          ),
        ).toEqual({ ok: false, code: QuestionnaireErrorCode.BlockNotFound });
      });
    });
  },
);
