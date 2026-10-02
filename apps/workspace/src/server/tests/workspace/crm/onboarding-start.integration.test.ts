import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QuestionnairePrefillSource } from "@invessiv/common/constants/crm/questionnaire/questionnaire-prefill-sources";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import {
  activities,
  customerContactAssignments,
  customers,
  onboardingAnswers,
  people,
} from "@invessiv/db/record-configuration";
import { ONBOARDING_FORM_ACTIVITY_ENTITY } from "@/common/constants/crm/onboarding-form-activity-metadata";
import { startProjectOnboarding } from "@/server/workspace/crm/command-handler/start-project-onboarding.command-handler";
import { updateQuestionnaireField } from "@/server/workspace/crm/command-handler/update-questionnaire-field.command-handler";
import { getOnboardingFormContext } from "@/server/workspace/crm/query-handler/get-onboarding-form-context.query-handler";
import { getOnboardingForm } from "@/server/workspace/crm/query-handler/get-onboarding-form.query-handler";
import { getProjectOnboarding } from "@/server/workspace/crm/query-handler/get-project-onboarding.query-handler";
import { questionnaireBlockCopyService } from "@/server/workspace/crm/services/questionnaire/questionnaire-block-copy-service";
import { questionnaireDefinitionReadService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-read-service";
import { createOnboardingIntegrationFixture } from "./support/onboarding-integration-fixture";
import {
  fieldByKey,
  updateFieldRequestFixture,
} from "./support/questionnaire-definition-fixtures";

vi.mock("server-only", () => ({}));
// Every test talks to the development database several dozen times.
vi.setConfig({ testTimeout: 60_000 });

/** The form's copy of a catalog block. */
function copyOf(form: OnboardingFormDto, source: QuestionnaireBlockDto) {
  return form.blocks.find((step) => step.block.sourceBlockId === source.id)!
    .block;
}

function answersOf(form: OnboardingFormDto, fieldId: string) {
  return form.answers
    .filter((answer) => answer.fieldId === fieldId)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "onboarding start PostgreSQL integration",
  () => {
    const f = createOnboardingIntegrationFixture();

    // The CRM pre-fill reads customer master data, which needs `customers.read` besides `projects.write`.
    const starter = () =>
      f.member([
        Permission.ProjectsRead,
        Permission.ProjectsWrite,
        Permission.FilesRead,
        Permission.CustomersRead,
      ]);

    async function start(projectId: string, templateId: string | null) {
      return f.value(
        await startProjectOnboarding(projectId, { templateId }, starter()),
      );
    }

    /** A draft on a fresh project; the tests fill it and then complete it. */
    async function startedForm(templateId: string) {
      return start(await f.project(), templateId);
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
    }, 60_000);

    it("copies every template block once, in template order, as a pending draft", async () => {
      const first = await f.catalogBlock([{ key: "name", type: T.ShortText }]);
      const second = await f.catalogBlock([{ key: "logo", type: T.Files }]);
      const template = await f.template([second.id, first.id]);
      const projectId = await f.project();

      const form = await start(projectId, template.id);

      expect(form).toMatchObject({
        projectId,
        customerId: f.customerId,
        sourceTemplateId: template.id,
        status: OnboardingFormStatus.Draft,
        createdByMemberId: f.memberId,
        releasedAt: null,
        version: 1,
      });
      expect(
        form.blocks.map((step) => [
          step.position,
          step.reviewStatus,
          step.block.sourceBlockId,
          step.block.key,
        ]),
      ).toEqual([
        [0, OnboardingBlockReviewStatus.Pending, second.id, second.key],
        [1, OnboardingBlockReviewStatus.Pending, first.id, first.key],
      ]);
      expect(form.blocks.map((step) => step.block.id)).not.toContain(first.id);
      expect(
        await questionnaireDefinitionReadService.findBlock(
          f.database(),
          first.id,
          null,
        ),
      ).toEqual(first);

      const [activity] = await f
        .database()
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.project_id, projectId),
            eq(activities.type, ActivityType.Created),
          ),
        );
      expect(activity.metadata).toEqual({
        entity: ONBOARDING_FORM_ACTIVITY_ENTITY,
        onboarding_form_id: form.id,
      });
      expect(await getOnboardingForm(form.id, f.member())).toEqual(form);
      expect(await getOnboardingFormContext(form.id, f.member())).toEqual({
        customerId: f.customerId,
        customerName: expect.stringContaining(f.customerId),
        projectId,
        projectTitle: expect.stringContaining("integration:files:"),
        projectPhase: ProjectPhase.Onboarding,
        templateTitle: template.title,
      });
    });

    it("starts without a template as an empty draft", async () => {
      const form = await start(await f.project(), null);
      expect(form).toMatchObject({ sourceTemplateId: null, blocks: [] });
      expect(await getOnboardingFormContext(form.id, f.member())).toMatchObject(
        {
          templateTitle: null,
        },
      );
    });

    it("keeps the form unchanged when the catalog field changes afterwards", async () => {
      const block = await f.catalogBlock([{ key: "name", type: T.ShortText }]);
      const form = await start(
        await f.project(),
        (await f.template([block.id])).id,
      );

      f.value(
        await updateQuestionnaireField(
          fieldByKey(block, "name").id,
          updateFieldRequestFixture("renamed", T.ShortText, block.version),
        ),
      );

      const reread = await getOnboardingForm(form.id, f.member());
      expect(copyOf(reread!, block).fields.map((field) => field.key)).toEqual([
        "name",
      ]);
    });

    it("rejects an unknown and an archived template", async () => {
      const archived = await f.template(
        [],
        QuestionnaireCatalogStatus.Archived,
      );
      for (const templateId of [crypto.randomUUID(), archived.id])
        expect(
          await startProjectOnboarding(
            await f.project(),
            { templateId },
            f.member(),
          ),
        ).toEqual({
          ok: false,
          code: QuestionnaireErrorCode.TemplateNotFound,
        });
    });

    it("rejects a second form for the same project", async () => {
      const projectId = await f.project();
      await start(projectId, null);
      expect(
        await startProjectOnboarding(
          projectId,
          { templateId: null },
          f.member(),
        ),
      ).toEqual({ ok: false, code: OnboardingErrorCode.FormExists });
    });

    it("creates exactly one form for two parallel starts", async () => {
      const projectId = await f.project();
      const results = await Promise.all([
        startProjectOnboarding(projectId, { templateId: null }, f.member()),
        startProjectOnboarding(projectId, { templateId: null }, f.member()),
      ]);
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      expect(results.find((result) => !result.ok)).toEqual({
        ok: false,
        code: OnboardingErrorCode.FormExists,
      });
    });

    it.each([
      ProjectStatus.Paused,
      ProjectStatus.Completed,
      ProjectStatus.Cancelled,
      ProjectStatus.Archived,
    ])("rejects a %s project", async (status) => {
      const projectId = await f.project({ status });
      expect(
        await startProjectOnboarding(
          projectId,
          { templateId: null },
          f.member(),
        ),
      ).toEqual({ ok: false, code: OnboardingErrorCode.ProjectNotEligible });
      expect(await getProjectOnboarding(projectId, f.member())).toMatchObject({
        form: null,
        canStart: false,
        projectEligible: false,
      });
    });

    it("starts for a planned project", async () => {
      const projectId = await f.project({ status: ProjectStatus.Planned });
      expect(await getProjectOnboarding(projectId, f.member())).toMatchObject({
        form: null,
        canStart: true,
        projectEligible: true,
      });
      expect(await start(projectId, null)).toMatchObject({ projectId });
    });

    it("hides foreign customers, projects outside a bound role and read-only members", async () => {
      const request = { templateId: null };
      const notFound = { ok: false, code: OnboardingErrorCode.ProjectNotFound };
      const foreign = await f.project({ customerId: f.foreignCustomerId });
      const customerBound = f.actor({
        permissions: new Set(),
        customerPermissions: new Map([
          [
            f.customerId,
            new Set([Permission.ProjectsRead, Permission.ProjectsWrite]),
          ],
        ]),
      });
      expect(
        await startProjectOnboarding(foreign, request, customerBound),
      ).toEqual(notFound);
      expect(await getProjectOnboarding(foreign, customerBound)).toBeNull();

      const own = await f.project();
      const projectBound = f.actor({
        permissions: new Set(),
        projectPermissions: new Map([
          [
            f.siblingProjectId,
            {
              customerId: f.customerId,
              permissions: new Set([
                Permission.ProjectsRead,
                Permission.ProjectsWrite,
              ]),
            },
          ],
        ]),
      });
      expect(await startProjectOnboarding(own, request, projectBound)).toEqual(
        notFound,
      );
      expect(await getProjectOnboarding(own, projectBound)).toBeNull();

      const reader = f.member([Permission.ProjectsRead]);
      expect(await startProjectOnboarding(own, request, reader)).toEqual(
        notFound,
      );
      expect(await getProjectOnboarding(own, reader)).toMatchObject({
        form: null,
        canStart: false,
        projectEligible: true,
      });

      const form = await start(own, null);
      expect(await getOnboardingForm(form.id, projectBound)).toBeNull();
      expect(await getOnboardingFormContext(form.id, projectBound)).toBeNull();
      expect(await getOnboardingForm(form.id, customerBound)).toMatchObject({
        id: form.id,
      });
      expect(
        await getOnboardingForm((await start(foreign, null)).id, customerBound),
      ).toBeNull();
      expect(await f.formOfProject(own)).toMatchObject({ id: form.id });
    });

    it("rejects invalid input before touching the project", async () => {
      const projectId = await f.project();
      expect(
        await startProjectOnboarding(
          projectId,
          { templateId: "not-a-uuid" },
          f.member(),
        ),
      ).toMatchObject({ ok: false, code: OnboardingErrorCode.ValidationError });
      expect(
        await startProjectOnboarding(
          "not-a-uuid",
          { templateId: null },
          f.member(),
        ),
      ).toEqual({ ok: false, code: OnboardingErrorCode.ProjectNotFound });
    });

    it("leaves no form behind when copying a block fails", async () => {
      const block = await f.catalogBlock([{ key: "name", type: T.ShortText }]);
      const other = await f.catalogBlock();
      const template = await f.template([block.id, other.id]);
      const projectId = await f.project();
      const copy = questionnaireBlockCopyService.copyBlock;
      const spy = vi
        .spyOn(questionnaireBlockCopyService, "copyBlock")
        .mockImplementationOnce(copy)
        .mockRejectedValueOnce(new Error("copy failed"));

      await expect(
        startProjectOnboarding(
          projectId,
          { templateId: template.id },
          f.member(),
        ),
      ).rejects.toThrow("copy failed");
      spy.mockRestore();

      expect(await f.formOfProject(projectId)).toBeUndefined();
    });

    describe("pre-fill from the last completed form", () => {
      async function carryOverBlock() {
        return f.catalogBlock(
          [
            { key: "slogan", type: T.ShortText },
            {
              key: "tone",
              type: T.Choice,
              overrides: {
                choices: [
                  { key: "formal", labels: { de: "Förmlich" } },
                  { key: "casual", labels: { de: "Locker" } },
                ],
              },
            },
            {
              key: "channels",
              type: T.MultiChoice,
              overrides: {
                choices: [
                  { key: "web", labels: { de: "Web" } },
                  { key: "print", labels: { de: "Print" } },
                  { key: "social", labels: { de: "Social" } },
                ],
              },
            },
            { key: "newsletter", type: T.YesNo },
            { key: "rights", type: T.Confirmation },
            { key: "logo", type: T.Files },
            { key: "team", type: T.Group },
            { key: "member_name", type: T.ShortText, parent: "team" },
            { key: "portrait", type: T.Files, parent: "team" },
          ],
          { carryOver: true },
        );
      }

      /** Fills the copy of `source` in `form` with one answer of every kind. */
      async function fill(
        form: OnboardingFormDto,
        source: QuestionnaireBlockDto,
      ) {
        const block = copyOf(form, source);
        const field = (key: string) => fieldByKey(block, key);
        const choice = (key: string, choiceKey: string) =>
          field(key).choices.find((option) => option.key === choiceKey)!.id;

        await f.answer(form, field("slogan").id, { value: "Klar und nah" });
        await f.answer(form, field("tone").id, {
          choiceId: choice("tone", "casual"),
        });
        await f.answer(form, field("channels").id, {
          choiceId: choice("channels", "social"),
          sortOrder: 0,
        });
        await f.answer(form, field("channels").id, {
          choiceId: choice("channels", "web"),
          sortOrder: 1,
        });
        await f.answer(form, field("newsletter").id, {
          choiceId: choice("newsletter", "yes"),
        });
        await f.answer(form, field("rights").id, { value: "true" });
        const logo = await f.answerFile(form, field("logo").id, 0);
        const anna = await f.groupEntry(form, field("team").id, 0);
        const ben = await f.groupEntry(form, field("team").id, 1);
        await f.answer(form, field("member_name").id, {
          value: "Anna",
          groupEntryId: anna,
        });
        await f.answer(form, field("member_name").id, {
          value: "Ben",
          groupEntryId: ben,
        });
        const portrait = await f.answerFile(form, field("portrait").id, 0, ben);
        return { logo, portrait };
      }

      it("takes over answers, selections, group entries and file links of a carry-over block", async () => {
        const block = await carryOverBlock();
        const template = await f.template([block.id]);
        const previous = await startedForm(template.id);
        const fileIds = await fill(previous, block);
        await f.setFormStatus(previous.id, OnboardingFormStatus.Completed);

        const form = await start(await f.project(), template.id);
        const copy = copyOf(form, block);
        const field = (key: string) => fieldByKey(copy, key);
        const choiceKey = (key: string, choiceId: string | null) =>
          field(key).choices.find((option) => option.id === choiceId)?.key;

        expect(answersOf(form, field("slogan").id)).toEqual([
          expect.objectContaining({ value: "Klar und nah", choiceId: null }),
        ]);
        expect(
          answersOf(form, field("tone").id).map((answer) =>
            choiceKey("tone", answer.choiceId),
          ),
        ).toEqual(["casual"]);
        expect(
          answersOf(form, field("channels").id).map((answer) => [
            answer.sortOrder,
            choiceKey("channels", answer.choiceId),
          ]),
        ).toEqual([
          [0, "social"],
          [1, "web"],
        ]);
        expect(
          answersOf(form, field("newsletter").id).map((answer) =>
            choiceKey("newsletter", answer.choiceId),
          ),
        ).toEqual(["yes"]);
        // A confirmation is an act of consent in its own form and is never taken over.
        expect(answersOf(form, field("rights").id)).toEqual([]);

        expect(
          form.answerFiles
            .filter((link) => link.fieldId === field("logo").id)
            .map((link) => [link.groupEntryId, link.file.id]),
        ).toEqual([[null, fileIds.logo]]);

        const entries = form.groupEntries
          .filter((entry) => entry.fieldId === field("team").id)
          .sort((left, right) => left.position - right.position);
        expect(entries.map((entry) => entry.position)).toEqual([0, 1]);
        const previousEntryIds = new Set(
          (await getOnboardingForm(previous.id, f.member()))!.groupEntries.map(
            (entry) => entry.id,
          ),
        );
        expect(entries.some((entry) => previousEntryIds.has(entry.id))).toBe(
          false,
        );
        expect(
          answersOf(form, field("member_name").id).map((answer) => [
            entries.findIndex((entry) => entry.id === answer.groupEntryId),
            answer.value,
          ]),
        ).toEqual(
          expect.arrayContaining([
            [0, "Anna"],
            [1, "Ben"],
          ]),
        );
        expect(
          form.answerFiles
            .filter((link) => link.fieldId === field("portrait").id)
            .map((link) => [
              entries.findIndex((entry) => entry.id === link.groupEntryId),
              link.file.id,
            ]),
        ).toEqual([[1, fileIds.portrait]]);
      });

      it("marks taken-over answers with the member who started the form", async () => {
        const block = await f.catalogBlock(
          [{ key: "slogan", type: T.ShortText }],
          { carryOver: true },
        );
        const template = await f.template([block.id]);
        const previous = await startedForm(template.id);
        await f.answer(
          previous,
          fieldByKey(copyOf(previous, block), "slogan").id,
          {
            value: "Alt",
          },
        );
        await f.setFormStatus(previous.id, OnboardingFormStatus.Completed);

        const form = await start(await f.project(), template.id);

        const rows = await f
          .database()
          .select()
          .from(onboardingAnswers)
          .where(eq(onboardingAnswers.form_id, form.id));
        expect(rows).toEqual([
          expect.objectContaining({
            value: "Alt",
            updated_by_member_id: f.memberId,
            updated_by_portal_membership_id: null,
          }),
        ]);
      });

      it("ignores blocks without carry-over and blocks of another origin", async () => {
        const plain = await f.catalogBlock([
          { key: "slogan", type: T.ShortText },
        ]);
        const compact = await f.catalogBlock(
          [{ key: "slogan", type: T.ShortText }],
          { carryOver: true },
        );
        const full = await f.catalogBlock(
          [{ key: "slogan", type: T.ShortText }],
          { carryOver: true },
        );
        const previous = await startedForm(
          (await f.template([plain.id, compact.id])).id,
        );
        for (const source of [plain, compact])
          await f.answer(
            previous,
            fieldByKey(copyOf(previous, source), "slogan").id,
            { value: "Alt" },
          );
        await f.setFormStatus(previous.id, OnboardingFormStatus.Completed);

        const form = await start(
          await f.project(),
          (await f.template([plain.id, full.id])).id,
        );

        expect(form.answers).toEqual([]);
      });

      it("drops values whose field or option is gone and never guesses", async () => {
        const block = await f.catalogBlock(
          [
            { key: "slogan", type: T.ShortText },
            {
              key: "tone",
              type: T.Choice,
              overrides: {
                choices: [
                  { key: "formal", labels: { de: "Förmlich" } },
                  { key: "casual", labels: { de: "Locker" } },
                ],
              },
            },
            { key: "website", type: T.Url },
          ],
          { carryOver: true },
        );
        const template = await f.template([block.id]);
        const previous = await startedForm(template.id);
        const copy = copyOf(previous, block);
        await f.answer(previous, fieldByKey(copy, "slogan").id, {
          value: "Alt",
        });
        await f.answer(previous, fieldByKey(copy, "tone").id, {
          choiceId: fieldByKey(copy, "tone").choices[1]!.id,
        });
        await f.answer(previous, fieldByKey(copy, "website").id, {
          value: "https://alt.example.com",
        });
        await f.setFormStatus(previous.id, OnboardingFormStatus.Completed);

        // The catalog moved on: the text field has a new key, the chosen option is gone.
        const renamed = f.value(
          await updateQuestionnaireField(
            fieldByKey(block, "slogan").id,
            updateFieldRequestFixture("claim", T.ShortText, block.version),
          ),
        );
        f.value(
          await updateQuestionnaireField(
            fieldByKey(renamed, "tone").id,
            updateFieldRequestFixture("tone", T.Choice, renamed.version, {
              choices: [
                { key: "formal", labels: { de: "Förmlich" } },
                { key: "playful", labels: { de: "Verspielt" } },
              ],
            }),
          ),
        );

        const form = await start(await f.project(), template.id);

        const next = copyOf(form, block);
        expect(form.answers).toEqual([
          expect.objectContaining({
            fieldId: fieldByKey(next, "website").id,
            value: "https://alt.example.com",
          }),
        ]);
      });

      it("uses only a completed form, never one that is still open", async () => {
        const block = await f.catalogBlock(
          [{ key: "slogan", type: T.ShortText }],
          { carryOver: true },
        );
        const template = await f.template([block.id]);
        const older = await startedForm(template.id);
        await f.answer(older, fieldByKey(copyOf(older, block), "slogan").id, {
          value: "Abgeschlossen",
        });
        await f.setFormStatus(older.id, OnboardingFormStatus.Completed);
        // The second form took the answer over; the customer has changed it since.
        const open = await startedForm(template.id);
        await f
          .database()
          .update(onboardingAnswers)
          .set({ value: "Noch offen" })
          .where(eq(onboardingAnswers.form_id, open.id));
        await f.setFormStatus(open.id, OnboardingFormStatus.Open);

        const projectId = await f.project();
        expect(await getProjectOnboarding(projectId, f.member())).toMatchObject(
          { prefillAvailable: true },
        );
        const form = await start(projectId, template.id);

        expect(form.answers.map((answer) => answer.value)).toEqual([
          "Abgeschlossen",
        ]);
      });

      it("never reads another customer's completed form", async () => {
        const block = await f.catalogBlock(
          [{ key: "slogan", type: T.ShortText }],
          { carryOver: true },
        );
        const template = await f.template([block.id]);
        const previous = await startedForm(template.id);
        await f.answer(
          previous,
          fieldByKey(copyOf(previous, block), "slogan").id,
          { value: "Fremd" },
        );
        await f.setFormStatus(previous.id, OnboardingFormStatus.Completed);

        const foreignProject = await f.project({
          customerId: f.foreignCustomerId,
        });
        expect(
          await getProjectOnboarding(foreignProject, f.member()),
        ).toMatchObject({ prefillAvailable: false });
        const form = await start(foreignProject, template.id);

        expect(form.answers).toEqual([]);
      });
    });

    describe("pre-fill from the CRM", () => {
      const source = (prefillSource: QuestionnairePrefillSource) => ({
        overrides: { prefillSource },
      });

      async function crmBlock(carryOver: boolean) {
        return f.catalogBlock(
          [
            {
              key: "company",
              type: T.ShortText,
              ...source(QuestionnairePrefillSource.CustomerCompanyName),
            },
            {
              key: "address",
              type: T.LongText,
              ...source(QuestionnairePrefillSource.CustomerAddress),
            },
            {
              key: "vat",
              type: T.ShortText,
              ...source(QuestionnairePrefillSource.CustomerVatId),
            },
            {
              key: "website",
              type: T.Url,
              ...source(QuestionnairePrefillSource.CustomerWebsiteUrl),
            },
            {
              key: "contact",
              type: T.ShortText,
              ...source(QuestionnairePrefillSource.PrimaryContactName),
            },
            {
              key: "email",
              type: T.Email,
              ...source(QuestionnairePrefillSource.PrimaryContactEmail),
            },
            {
              key: "phone",
              type: T.Phone,
              ...source(QuestionnairePrefillSource.PrimaryContactPhone),
            },
            { key: "free", type: T.ShortText },
          ],
          { carryOver },
        );
      }

      async function setCrmData() {
        const db = f.database();
        await db
          .update(customers)
          .set({
            company_name: "Nordlicht Coaching GmbH",
            street: "Hafenweg 3",
            postal_code: "50667",
            city: "Köln",
            country: null,
            vat_id: "DE123456789",
            website_url: "https://nordlicht.example.com",
          })
          .where(eq(customers.id, f.customerId));
        await db
          .update(people)
          .set({
            display_name: "Anna Berger",
            primary_email: "anna.privat@example.com",
            primary_phone: "+49 221 000000",
          })
          .where(eq(people.id, f.personId));
        await db
          .update(customerContactAssignments)
          .set({ business_email: "anna@nordlicht.example.com" })
          .where(eq(customerContactAssignments.customer_id, f.customerId));
      }

      function valuesByKey(
        form: OnboardingFormDto,
        block: QuestionnaireBlockDto,
      ) {
        const copy = copyOf(form, block);
        return Object.fromEntries(
          form.answers.map((answer) => [
            copy.fields.find((field) => field.id === answer.fieldId)!.key,
            answer.value,
          ]),
        );
      }

      it("fills customer and primary contact data, business before personal", async () => {
        await setCrmData();
        const block = await crmBlock(false);

        const form = await start(
          await f.project(),
          (await f.template([block.id])).id,
        );

        expect(valuesByKey(form, block)).toEqual({
          company: "Nordlicht Coaching GmbH",
          address: "Hafenweg 3\n50667 Köln",
          vat: "DE123456789",
          website: "https://nordlicht.example.com",
          contact: "Anna Berger",
          email: "anna@nordlicht.example.com",
          phone: "+49 221 000000",
        });
        const [customer] = await f
          .database()
          .select()
          .from(customers)
          .where(eq(customers.id, f.customerId));
        expect(customer.company_name).toBe("Nordlicht Coaching GmbH");
      });

      it("fills only fields without a taken-over answer", async () => {
        await setCrmData();
        const block = await crmBlock(true);
        const template = await f.template([block.id]);
        const previous = await startedForm(template.id);
        const copy = copyOf(previous, block);
        // The start already pre-filled this draft from the CRM; the customer then changed one answer.
        await f
          .database()
          .update(onboardingAnswers)
          .set({ value: "Nordlicht Akademie GmbH" })
          .where(
            and(
              eq(onboardingAnswers.form_id, previous.id),
              eq(onboardingAnswers.field_id, fieldByKey(copy, "company").id),
            ),
          );
        await f
          .database()
          .delete(onboardingAnswers)
          .where(
            and(
              eq(onboardingAnswers.form_id, previous.id),
              eq(onboardingAnswers.field_id, fieldByKey(copy, "vat").id),
            ),
          );
        await f.setFormStatus(previous.id, OnboardingFormStatus.Completed);

        const form = await start(await f.project(), template.id);

        expect(valuesByKey(form, block)).toMatchObject({
          company: "Nordlicht Akademie GmbH",
          vat: "DE123456789",
        });
      });

      it("skips sources that are empty or do not fit the field", async () => {
        const block = await crmBlock(false);
        const foreignProject = await f.project({
          customerId: f.foreignCustomerId,
        });
        await f
          .database()
          .update(customers)
          .set({ website_url: "nordlicht.example.com" })
          .where(eq(customers.id, f.foreignCustomerId));

        const form = await start(
          foreignProject,
          (await f.template([block.id])).id,
        );

        // The foreign fixture customer has no primary contact, no address and an invalid URL.
        expect(form.answers).toEqual([]);
      });
    });
  },
);
