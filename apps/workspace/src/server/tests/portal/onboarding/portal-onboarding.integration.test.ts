import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { PortalOnboardingErrorCode as E } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import {
  activities,
  messages,
  onboardingAnswers,
  onboardingFormBlocks,
} from "@invessiv/db/record-configuration";
import { ONBOARDING_FORM_ACTIVITY_ENTITY } from "@/common/constants/crm/onboarding-form-activity-metadata";
import { createPortalActor } from "@/server/portal/auth/portal-actor";
import { savePortalOnboardingAnswer } from "@/server/portal/command-handler/save-portal-onboarding-answer.command-handler";
import { submitPortalOnboarding } from "@/server/portal/command-handler/submit-portal-onboarding.command-handler";
import { getPortalOnboardingForm } from "@/server/portal/query-handler/get-portal-onboarding-form.query-handler";
import { getPortalOnboardingWidgetForm } from "@/server/portal/query-handler/get-portal-onboarding-widget-form.query-handler";
import { messageService } from "@/server/shared/services/message/message-service";
import { createPortalSessionFixture } from "@/server/tests/support/portal-session-fixture";
import { startProjectOnboarding } from "@/server/workspace/crm/command-handler/start-project-onboarding.command-handler";
import { createOnboardingIntegrationFixture } from "../../workspace/crm/support/onboarding-integration-fixture";
import { fieldByKey } from "../../workspace/crm/support/questionnaire-definition-fixtures";

vi.mock("server-only", () => ({}));
// Every test talks to the development database several dozen times.
vi.setConfig({ testTimeout: 60_000 });

const NOT_FOUND = { ok: false, code: E.NotFound };
const LOCKED = { ok: false, code: E.Locked };
const VALIDATION = { ok: false, code: E.Validation };
const REQUIRED = { requirement: QuestionnaireFieldRequirement.Required };
const CHOICES = [
  { key: "a", labels: { de: "A", en: "A" } },
  { key: "b", labels: { de: "B", en: "B" } },
  { key: "c", labels: { de: "C", en: "C" } },
];

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "portal onboarding with real portal sessions",
  () => {
    const f = createOnboardingIntegrationFixture();
    const PREFIX = `integration:onboarding-sessions:${crypto.randomUUID()}:`;
    const sessions = createPortalSessionFixture(
      () => f.database(),
      f.memberId,
      PREFIX,
    );

    /** A released form on a fresh project, built from the given catalog blocks. */
    async function openForm(
      blocks: readonly QuestionnaireBlockDto[],
      status: OnboardingFormStatus = OnboardingFormStatus.Open,
    ): Promise<OnboardingFormDto> {
      const template = await f.template(blocks.map((block) => block.id));
      const form = f.value(
        await startProjectOnboarding(
          await f.project(),
          { templateId: template.id },
          f.member(),
        ),
      );
      await f.setFormStatus(form.id, status);
      return form;
    }

    /** The form's own copy of the field with this key. */
    function field(form: OnboardingFormDto, key: string) {
      for (const step of form.blocks) {
        const found = fieldByKey(step.block, key);
        if (found) return found;
      }
      throw new Error(`No field ${key}`);
    }

    function choiceId(form: OnboardingFormDto, key: string, choiceKey: string) {
      return field(form, key).choices.find(
        (choice) => choice.key === choiceKey,
      )!.id;
    }

    async function storedAnswers(formId: string, fieldId: string) {
      return f
        .database()
        .select()
        .from(onboardingAnswers)
        .where(
          and(
            eq(onboardingAnswers.form_id, formId),
            eq(onboardingAnswers.field_id, fieldId),
          ),
        )
        .orderBy(onboardingAnswers.sort_order);
    }

    function saveText(
      actor: Parameters<typeof savePortalOnboardingAnswer>[0],
      form: OnboardingFormDto,
      key: string,
      value: string,
    ) {
      return savePortalOnboardingAnswer(actor, form.id, {
        fieldId: field(form, key).id,
        groupEntryId: null,
        values: value === "" ? [] : [value],
      });
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      vi.restoreAllMocks();
      await f.cleanup();
      await sessions.cleanup();
    }, 60_000);

    it("keeps a draft out of the portal for reading and writing", async () => {
      const contact = await sessions.session(f.customerId);
      const block = await f.catalogBlock([{ key: "name", type: T.ShortText }]);
      const form = await openForm([block], OnboardingFormStatus.Draft);

      expect(
        await getPortalOnboardingForm(contact, form.id, Locale.De),
      ).toBeNull();
      expect(
        await getPortalOnboardingWidgetForm(contact, form.projectId),
      ).toBeNull();
      expect(await saveText(contact, form, "name", "Acme")).toEqual(NOT_FOUND);
      expect(await submitPortalOnboarding(contact, form.id)).toEqual(NOT_FOUND);
    });

    it("shows a released form with resolved texts, editable blocks and the submit right", async () => {
      const contact = await sessions.session(f.customerId);
      const block = await f.catalogBlock([
        { key: "name", type: T.ShortText, overrides: REQUIRED },
      ]);
      const form = await openForm([block]);

      const dto = await getPortalOnboardingForm(contact, form.id, Locale.En);

      expect(dto).toMatchObject({
        id: form.id,
        projectId: form.projectId,
        status: OnboardingFormStatus.Open,
        canSubmit: true,
        editableBlockIds: [form.blocks[0].block.id],
        blocks: [
          {
            id: form.blocks[0].block.id,
            title: "Block",
            fallbackLocale: null,
            fields: [{ id: field(form, "name").id, label: "name" }],
          },
        ],
      });
      expect(
        await getPortalOnboardingWidgetForm(contact, form.projectId),
      ).toMatchObject({
        id: form.id,
        status: OnboardingFormStatus.Open,
        progress: { answeredRequired: 0, totalRequired: 1 },
      });
    });

    it("gives a contact of another company nothing on any endpoint", async () => {
      const stranger = await sessions.session(f.foreignCustomerId);
      const block = await f.catalogBlock([{ key: "name", type: T.ShortText }]);
      const form = await openForm([block]);

      expect(
        await getPortalOnboardingForm(stranger, form.id, Locale.De),
      ).toBeNull();
      expect(
        await getPortalOnboardingWidgetForm(stranger, form.projectId),
      ).toBeNull();
      expect(await saveText(stranger, form, "name", "Acme")).toEqual(NOT_FOUND);
      expect(await submitPortalOnboarding(stranger, form.id)).toEqual(
        NOT_FOUND,
      );
      expect(await storedAnswers(form.id, field(form, "name").id)).toEqual([]);
    });

    it("hides the form of a project the portal does not show", async () => {
      const contact = await sessions.session(f.customerId);
      const block = await f.catalogBlock([{ key: "name", type: T.ShortText }]);
      const template = await f.template([block.id]);
      const projectId = await f.project();
      const form = f.value(
        await startProjectOnboarding(
          projectId,
          { templateId: template.id },
          f.member(),
        ),
      );
      await f.setFormStatus(form.id, OnboardingFormStatus.Open);
      await f.setProjectStatus(projectId, ProjectStatus.Archived);

      expect(
        await getPortalOnboardingForm(contact, form.id, Locale.De),
      ).toBeNull();
      expect(await saveText(contact, form, "name", "Acme")).toEqual(NOT_FOUND);
      expect(await submitPortalOnboarding(contact, form.id)).toEqual(NOT_FOUND);
    });

    it("needs portal.onboarding.read to see and portal.onboarding.submit to write", async () => {
      const contact = await sessions.session(f.customerId);
      const block = await f.catalogBlock([{ key: "name", type: T.ShortText }]);
      const form = await openForm([block]);
      const withPermissions = (permissions: Permission[]) =>
        createPortalActor({
          userId: contact.userId,
          membershipId: contact.membershipId,
          customerId: contact.customerId,
          personId: contact.personId,
          firstName: null,
          permissions: new Set(permissions),
          projectPermissions: new Map(),
        });
      const blind = withPermissions([
        Permission.PortalAccess,
        Permission.PortalOnboardingSubmit,
      ]);
      const reader = withPermissions([
        Permission.PortalAccess,
        Permission.PortalOnboardingRead,
      ]);

      expect(
        await getPortalOnboardingForm(blind, form.id, Locale.De),
      ).toBeNull();
      expect(
        await getPortalOnboardingWidgetForm(blind, form.projectId),
      ).toBeNull();
      expect(await saveText(blind, form, "name", "Acme")).toMatchObject({
        ok: true,
      });

      expect(
        await getPortalOnboardingForm(reader, form.id, Locale.De),
      ).toMatchObject({ canSubmit: false, editableBlockIds: [] });
      expect(await saveText(reader, form, "name", "Acme")).toEqual(NOT_FOUND);
      expect(await submitPortalOnboarding(reader, form.id)).toEqual(NOT_FOUND);
    });

    it("rejects a field of another form and a choice of another field", async () => {
      const contact = await sessions.session(f.customerId);
      const block = await f.catalogBlock([
        { key: "pick", type: T.Choice, overrides: { choices: CHOICES } },
        { key: "other", type: T.Choice, overrides: { choices: CHOICES } },
      ]);
      const form = await openForm([block]);
      const sibling = await openForm([block]);

      expect(
        await savePortalOnboardingAnswer(contact, form.id, {
          fieldId: field(sibling, "pick").id,
          groupEntryId: null,
          choiceIds: [choiceId(sibling, "pick", "a")],
        }),
      ).toEqual(NOT_FOUND);
      expect(
        await savePortalOnboardingAnswer(contact, form.id, {
          fieldId: field(form, "pick").id,
          groupEntryId: null,
          choiceIds: [choiceId(form, "other", "a")],
        }),
      ).toEqual(VALIDATION);
      expect(await storedAnswers(form.id, field(form, "pick").id)).toEqual([]);
    });

    it("replaces a slot: text overwrites, a multi choice swaps all rows, empty input deletes", async () => {
      const contact = await sessions.session(f.customerId, "Ada Lovelace");
      const block = await f.catalogBlock([
        { key: "name", type: T.ShortText },
        { key: "many", type: T.MultiChoice, overrides: { choices: CHOICES } },
      ]);
      const form = await openForm([block]);
      const name = field(form, "name").id;
      const many = field(form, "many").id;

      expect(await saveText(contact, form, "name", "Acme")).toMatchObject({
        ok: true,
        value: { savedByName: "Ada Lovelace" },
      });
      await saveText(contact, form, "name", "Acme GmbH");
      expect(await storedAnswers(form.id, name)).toMatchObject([
        {
          value: "Acme GmbH",
          sort_order: 0,
          updated_by_portal_membership_id: contact.membershipId,
          updated_by_member_id: null,
        },
      ]);

      const pick = (...keys: string[]) =>
        savePortalOnboardingAnswer(contact, form.id, {
          fieldId: many,
          groupEntryId: null,
          choiceIds: keys.map((key) => choiceId(form, "many", key)),
        });
      await pick("a", "b");
      await pick("c");
      expect(await storedAnswers(form.id, many)).toMatchObject([
        { choice_id: choiceId(form, "many", "c"), sort_order: 0 },
      ]);

      await pick();
      await saveText(contact, form, "name", "");
      expect(await storedAnswers(form.id, many)).toEqual([]);
      expect(await storedAnswers(form.id, name)).toEqual([]);

      const dto = await getPortalOnboardingForm(contact, form.id, Locale.De);
      expect(dto?.answers).toEqual([]);
    });

    it("marks a company-wide block as pre-filled until the customer rewrote its answers", async () => {
      const contact = await sessions.session(f.customerId, "Ada Lovelace");
      const block = await f.catalogBlock([{ key: "name", type: T.ShortText }], {
        carryOver: true,
      });
      const form = await openForm([block], OnboardingFormStatus.Draft);
      await f
        .database()
        .insert(onboardingAnswers)
        .values({
          id: crypto.randomUUID(),
          form_id: form.id,
          field_id: field(form, "name").id,
          group_entry_id: null,
          choice_id: null,
          value: "Acme",
          sort_order: 0,
          updated_by_portal_membership_id: null,
          updated_by_member_id: f.memberId,
        });
      await f.setFormStatus(form.id, OnboardingFormStatus.Open);

      expect(
        await getPortalOnboardingForm(contact, form.id, Locale.De),
      ).toMatchObject({
        blocks: [{ prefilled: true }],
        lastEditedByName: null,
      });

      await saveText(contact, form, "name", "Acme GmbH");
      const after = await getPortalOnboardingForm(contact, form.id, Locale.De);
      expect(after).toMatchObject({
        blocks: [{ prefilled: false }],
        lastEditedByName: "Ada Lovelace",
      });
      expect(after?.lastEditedAt).not.toBeNull();
    });

    it("stores nothing for an invalid value or a second choice on a single choice", async () => {
      const contact = await sessions.session(f.customerId);
      const block = await f.catalogBlock([
        { key: "mail", type: T.Email },
        { key: "pick", type: T.Choice, overrides: { choices: CHOICES } },
        { key: "logo", type: T.Files },
      ]);
      const form = await openForm([block]);

      expect(await saveText(contact, form, "mail", "not-an-email")).toEqual(
        VALIDATION,
      );
      expect(
        await savePortalOnboardingAnswer(contact, form.id, {
          fieldId: field(form, "pick").id,
          groupEntryId: null,
          choiceIds: [choiceId(form, "pick", "a"), choiceId(form, "pick", "b")],
        }),
      ).toEqual(VALIDATION);
      expect(
        await savePortalOnboardingAnswer(contact, form.id, {
          fieldId: field(form, "pick").id,
          groupEntryId: null,
          values: ["a"],
        }),
      ).toEqual(VALIDATION);
      expect(await saveText(contact, form, "logo", "file")).toEqual(VALIDATION);
      expect(await storedAnswers(form.id, field(form, "mail").id)).toEqual([]);
      expect(await storedAnswers(form.id, field(form, "pick").id)).toEqual([]);
    });

    it("refuses to submit while a visible required field is missing and ignores hidden ones", async () => {
      const contact = await sessions.session(f.customerId);
      let block = await f.catalogBlock([
        { key: "name", type: T.ShortText, overrides: REQUIRED },
        { key: "has_shop", type: T.YesNo },
      ]);
      const trigger = fieldByKey(block, "has_shop");
      block = await f.catalogField(block, {
        key: "shop_url",
        type: T.Url,
        overrides: {
          ...REQUIRED,
          conditionFieldId: trigger.id,
          conditionChoiceId: trigger.choices.find(
            (choice) => choice.key === "yes",
          )!.id,
        },
      });
      const form = await openForm([block]);

      expect(await submitPortalOnboarding(contact, form.id)).toEqual({
        ok: false,
        code: E.RequiredMissing,
        missing: [
          {
            blockId: form.blocks[0].block.id,
            fieldId: field(form, "name").id,
            groupEntryId: null,
          },
        ],
      });
      expect((await f.readFormRow(form.id)).status).toBe(
        OnboardingFormStatus.Open,
      );

      await saveText(contact, form, "name", "Acme");
      expect(await submitPortalOnboarding(contact, form.id)).toMatchObject({
        ok: true,
        value: { id: form.id, status: OnboardingFormStatus.Submitted },
      });
    });

    it("submits atomically with timestamp, contact, activity and chat notice, then locks every write", async () => {
      const contact = await sessions.session(f.customerId);
      const block = await f.catalogBlock([{ key: "name", type: T.ShortText }]);
      const form = await openForm([block]);
      await saveText(contact, form, "name", "Acme");

      expect(await submitPortalOnboarding(contact, form.id)).toMatchObject({
        ok: true,
      });

      const row = await f.readFormRow(form.id);
      expect(row).toMatchObject({
        status: OnboardingFormStatus.Submitted,
        submitted_by_portal_membership_id: contact.membershipId,
        version: form.version + 1,
      });
      expect(row.submitted_at).toBeInstanceOf(Date);
      const logged = await f
        .database()
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.project_id, form.projectId),
            eq(activities.type, ActivityType.SubmissionReceived),
          ),
        );
      expect(logged).toHaveLength(1);
      expect(logged[0].metadata).toMatchObject({
        entity: ONBOARDING_FORM_ACTIVITY_ENTITY,
        onboarding_form_id: form.id,
      });
      const chat = await f
        .database()
        .select({ body: messages.body })
        .from(messages)
        .where(eq(messages.customer_id, f.customerId));
      expect(chat.map((message) => message.body)).toContain(
        SystemMessageKey.OnboardingSubmitted,
      );

      expect(await saveText(contact, form, "name", "Other")).toEqual(LOCKED);
      expect(await submitPortalOnboarding(contact, form.id)).toEqual(LOCKED);
      expect(
        await getPortalOnboardingForm(contact, form.id, Locale.De),
      ).toMatchObject({
        status: OnboardingFormStatus.Submitted,
        editableBlockIds: [],
        answers: [{ value: "Acme" }],
      });
    });

    it("keeps the submission when the chat notice fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const contact = await sessions.session(f.customerId);
      const block = await f.catalogBlock([{ key: "name", type: T.ShortText }]);
      const form = await openForm([block]);
      const failure = vi
        .spyOn(messageService, "appendSystemMessage")
        .mockRejectedValue(new Error("chat down"));

      expect(await submitPortalOnboarding(contact, form.id)).toMatchObject({
        ok: true,
      });
      expect((await f.readFormRow(form.id)).status).toBe(
        OnboardingFormStatus.Submitted,
      );
      expect(failure).toHaveBeenCalledOnce();
      failure.mockRestore();
    });

    it("lets a change request be answered only in blocks handed back to the customer", async () => {
      const contact = await sessions.session(f.customerId);
      const first = await f.catalogBlock([{ key: "name", type: T.ShortText }]);
      const second = await f.catalogBlock([{ key: "note", type: T.LongText }]);
      const form = await openForm(
        [first, second],
        OnboardingFormStatus.ChangesRequested,
      );
      const flagged = form.blocks[1].block.id;
      await f
        .database()
        .update(onboardingFormBlocks)
        .set({
          review_status: OnboardingBlockReviewStatus.Clarification,
          clarification_mode: OnboardingClarificationMode.Customer,
          review_note: "Bitte ergänzen",
          reviewed_by_member_id: f.memberId,
          reviewed_at: new Date(),
        })
        .where(
          and(
            eq(onboardingFormBlocks.form_id, form.id),
            eq(onboardingFormBlocks.block_id, flagged),
          ),
        );

      expect(await saveText(contact, form, "name", "Acme")).toEqual(LOCKED);
      expect(await saveText(contact, form, "note", "Mehr")).toMatchObject({
        ok: true,
      });
      expect(
        await getPortalOnboardingForm(contact, form.id, Locale.De),
      ).toMatchObject({
        editableBlockIds: [flagged],
        blocks: [{ reviewNote: null }, { reviewNote: "Bitte ergänzen" }],
      });
      expect(await submitPortalOnboarding(contact, form.id)).toMatchObject({
        ok: true,
        value: { status: OnboardingFormStatus.Submitted },
      });
    });
  },
);
