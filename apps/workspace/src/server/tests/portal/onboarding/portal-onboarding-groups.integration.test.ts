import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { PortalOnboardingErrorCode as E } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import {
  files,
  onboardingAnswerFiles,
  onboardingAnswers,
  onboardingFormBlocks,
  onboardingGroupEntries,
} from "@invessiv/db/record-configuration";
import {
  createPortalActor,
  type PortalActor,
} from "@/server/portal/auth/portal-actor";
import { addPortalOnboardingGroupEntry } from "@/server/portal/command-handler/add-portal-onboarding-group-entry.command-handler";
import { confirmPortalOnboardingServices } from "@/server/portal/command-handler/confirm-portal-onboarding-services.command-handler";
import { movePortalOnboardingGroupEntry } from "@/server/portal/command-handler/move-portal-onboarding-group-entry.command-handler";
import { removePortalOnboardingGroupEntry } from "@/server/portal/command-handler/remove-portal-onboarding-group-entry.command-handler";
import { savePortalOnboardingAnswer } from "@/server/portal/command-handler/save-portal-onboarding-answer.command-handler";
import { submitPortalOnboarding } from "@/server/portal/command-handler/submit-portal-onboarding.command-handler";
import { getPortalOnboardingForm } from "@/server/portal/query-handler/get-portal-onboarding-form.query-handler";
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
const LIMIT_REACHED = { ok: false, code: E.LimitReached };
const REQUIRED = { requirement: QuestionnaireFieldRequirement.Required };
const TEAM = [
  { key: "team", type: T.Group },
  { key: "member_name", type: T.ShortText, parent: "team" },
];

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "portal onboarding group entries and services confirmation",
  () => {
    const f = createOnboardingIntegrationFixture();
    const PREFIX = `integration:onboarding-groups:${crypto.randomUUID()}:`;
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

    function storedEntries(formId: string) {
      return f
        .database()
        .select({
          id: onboardingGroupEntries.id,
          position: onboardingGroupEntries.position,
        })
        .from(onboardingGroupEntries)
        .where(eq(onboardingGroupEntries.form_id, formId))
        .orderBy(onboardingGroupEntries.position);
    }

    /** Adds an entry to the `team` group and returns its client-made id. */
    async function addEntry(
      actor: PortalActor,
      form: OnboardingFormDto,
    ): Promise<string> {
      const id = crypto.randomUUID();
      const result = await addPortalOnboardingGroupEntry(actor, form.id, {
        id,
        fieldId: field(form, "team").id,
      });
      if (!result.ok) throw new Error(`expected an entry, got ${result.code}`);
      return id;
    }

    /** Hands a form in `changes_requested` back to the customer for exactly one block. */
    async function reopenBlock(form: OnboardingFormDto, blockId: string) {
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
            eq(onboardingFormBlocks.block_id, blockId),
          ),
        );
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
      await sessions.cleanup();
    }, 60_000);

    it("appends entries with the client's id in order and shows them in the form", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([await f.catalogBlock(TEAM)]);
      const team = field(form, "team").id;
      const first = crypto.randomUUID();
      const second = crypto.randomUUID();

      expect(
        await addPortalOnboardingGroupEntry(contact, form.id, {
          id: first,
          fieldId: team,
        }),
      ).toEqual({
        ok: true,
        value: [{ id: first, fieldId: team, position: 0 }],
      });
      expect(
        await addPortalOnboardingGroupEntry(contact, form.id, {
          id: second,
          fieldId: team,
        }),
      ).toEqual({
        ok: true,
        value: [
          { id: first, fieldId: team, position: 0 },
          { id: second, fieldId: team, position: 1 },
        ],
      });
      expect(
        (await getPortalOnboardingForm(contact, form.id, Locale.De))
          ?.groupEntries,
      ).toEqual([
        { id: first, fieldId: team, position: 0 },
        { id: second, fieldId: team, position: 1 },
      ]);
    });

    it("treats a repeated add of the same entry as a success", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([await f.catalogBlock(TEAM)]);
      const id = await addEntry(contact, form);

      expect(
        await addPortalOnboardingGroupEntry(contact, form.id, {
          id,
          fieldId: field(form, "team").id,
        }),
      ).toMatchObject({ ok: true, value: [{ id, position: 0 }] });
      expect(await storedEntries(form.id)).toHaveLength(1);
    });

    it("saves a sub-field answer for an entry through the slot endpoint", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([await f.catalogBlock(TEAM)]);
      const entryId = await addEntry(contact, form);

      expect(
        await savePortalOnboardingAnswer(contact, form.id, {
          fieldId: field(form, "team").children[0].id,
          groupEntryId: entryId,
          values: ["Ada"],
        }),
      ).toMatchObject({ ok: true });
      expect(
        (await getPortalOnboardingForm(contact, form.id, Locale.De))?.answers,
      ).toMatchObject([{ groupEntryId: entryId, value: "Ada" }]);
    });

    it("rejects a field that is no group, a field of another form and an id used elsewhere", async () => {
      const contact = await sessions.session(f.customerId);
      const block = await f.catalogBlock([
        ...TEAM,
        { key: "name", type: T.ShortText },
      ]);
      const form = await openForm([block]);
      const sibling = await openForm([block]);
      const taken = await addEntry(contact, sibling);

      expect(
        await addPortalOnboardingGroupEntry(contact, form.id, {
          id: crypto.randomUUID(),
          fieldId: field(form, "name").id,
        }),
      ).toEqual(VALIDATION);
      expect(
        await addPortalOnboardingGroupEntry(contact, form.id, {
          id: crypto.randomUUID(),
          fieldId: field(form, "team").children[0].id,
        }),
      ).toEqual(VALIDATION);
      expect(
        await addPortalOnboardingGroupEntry(contact, form.id, {
          id: crypto.randomUUID(),
          fieldId: field(sibling, "team").id,
        }),
      ).toEqual(NOT_FOUND);
      expect(
        await addPortalOnboardingGroupEntry(contact, form.id, {
          id: taken,
          fieldId: field(form, "team").id,
        }),
      ).toEqual(VALIDATION);
      expect(
        await addPortalOnboardingGroupEntry(contact, form.id, {
          id: "not-a-uuid",
          fieldId: field(form, "team").id,
        }),
      ).toEqual(VALIDATION);
      expect(await storedEntries(form.id)).toEqual([]);
    });

    it("stops at the field's maximum of entries", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([
          { key: "team", type: T.Group, overrides: { maxItems: 1 } },
          { key: "member_name", type: T.ShortText, parent: "team" },
        ]),
      ]);
      await addEntry(contact, form);

      expect(
        await addPortalOnboardingGroupEntry(contact, form.id, {
          id: crypto.randomUUID(),
          fieldId: field(form, "team").id,
        }),
      ).toEqual(LIMIT_REACHED);
      expect(await storedEntries(form.id)).toHaveLength(1);
    });

    it("moves an entry one step and leaves the ends alone", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([await f.catalogBlock(TEAM)]);
      const first = await addEntry(contact, form);
      const second = await addEntry(contact, form);
      const third = await addEntry(contact, form);
      const order = async () =>
        (await storedEntries(form.id)).map((entry) => entry.id);

      expect(
        await movePortalOnboardingGroupEntry(
          contact,
          { formId: form.id, entryId: third },
          { direction: -1 },
        ),
      ).toMatchObject({
        ok: true,
        value: [
          { id: first, position: 0 },
          { id: third, position: 1 },
          { id: second, position: 2 },
        ],
      });
      expect(await order()).toEqual([first, third, second]);

      expect(
        await movePortalOnboardingGroupEntry(
          contact,
          { formId: form.id, entryId: first },
          { direction: -1 },
        ),
      ).toMatchObject({ ok: true });
      expect(
        await movePortalOnboardingGroupEntry(
          contact,
          { formId: form.id, entryId: second },
          { direction: 1 },
        ),
      ).toMatchObject({ ok: true });
      expect(await order()).toEqual([first, third, second]);

      expect(
        await movePortalOnboardingGroupEntry(
          contact,
          { formId: form.id, entryId: first },
          { direction: 2 as 1 },
        ),
      ).toEqual(VALIDATION);
    });

    it("removes an entry with its answers and file links, keeps the files and closes the gap", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([
          ...TEAM,
          { key: "portrait", type: T.Files, parent: "team" },
        ]),
      ]);
      const first = await addEntry(contact, form);
      const second = await addEntry(contact, form);
      const third = await addEntry(contact, form);
      const [name, portrait] = field(form, "team").children;
      await savePortalOnboardingAnswer(contact, form.id, {
        fieldId: name.id,
        groupEntryId: second,
        values: ["Ada"],
      });
      const fileId = await f.answerFile(form, portrait.id, 0, second);

      expect(
        await removePortalOnboardingGroupEntry(contact, {
          formId: form.id,
          entryId: second,
        }),
      ).toMatchObject({
        ok: true,
        value: [
          { id: first, position: 0 },
          { id: third, position: 1 },
        ],
      });

      const db = f.database();
      expect(
        await db
          .select()
          .from(onboardingAnswers)
          .where(eq(onboardingAnswers.form_id, form.id)),
      ).toEqual([]);
      expect(
        await db
          .select()
          .from(onboardingAnswerFiles)
          .where(eq(onboardingAnswerFiles.form_id, form.id)),
      ).toEqual([]);
      expect(
        await db
          .select({ id: files.id })
          .from(files)
          .where(eq(files.id, fileId)),
      ).toEqual([{ id: fileId }]);
    });

    it("answers an entry of another form like a missing one", async () => {
      const contact = await sessions.session(f.customerId);
      const block = await f.catalogBlock(TEAM);
      const form = await openForm([block]);
      const sibling = await openForm([block]);
      const foreign = await addEntry(contact, sibling);
      const target = { formId: form.id, entryId: foreign };

      expect(await removePortalOnboardingGroupEntry(contact, target)).toEqual(
        NOT_FOUND,
      );
      expect(
        await movePortalOnboardingGroupEntry(contact, target, { direction: 1 }),
      ).toEqual(NOT_FOUND);
      expect(
        await removePortalOnboardingGroupEntry(contact, {
          formId: form.id,
          entryId: "not-a-uuid",
        }),
      ).toEqual(NOT_FOUND);
      expect(await storedEntries(sibling.id)).toHaveLength(1);
    });

    it("gives a contact of another company and a contact without submit right nothing", async () => {
      const contact = await sessions.session(f.customerId);
      const stranger = await sessions.session(f.foreignCustomerId);
      const reader = createPortalActor({
        userId: contact.userId,
        membershipId: contact.membershipId,
        customerId: contact.customerId,
        personId: contact.personId,
        firstName: null,
        permissions: new Set([
          Permission.PortalAccess,
          Permission.PortalOnboardingRead,
        ]),
        projectPermissions: new Map(),
      });
      const form = await openForm([
        await f.catalogBlock([
          ...TEAM,
          { key: "services", type: T.ProjectServices },
        ]),
      ]);
      const entryId = await addEntry(contact, form);
      const target = { formId: form.id, entryId };

      for (const actor of [stranger, reader]) {
        expect(
          await addPortalOnboardingGroupEntry(actor, form.id, {
            id: crypto.randomUUID(),
            fieldId: field(form, "team").id,
          }),
        ).toEqual(NOT_FOUND);
        expect(
          await movePortalOnboardingGroupEntry(actor, target, { direction: 1 }),
        ).toEqual(NOT_FOUND);
        expect(await removePortalOnboardingGroupEntry(actor, target)).toEqual(
          NOT_FOUND,
        );
        expect(
          await confirmPortalOnboardingServices(actor, form.id, {
            confirmed: true,
            note: null,
          }),
        ).toEqual(NOT_FOUND);
      }
      expect(await storedEntries(form.id)).toEqual([
        { id: entryId, position: 0 },
      ]);
      expect((await f.readFormRow(form.id)).services_confirmed_at).toBeNull();
    });

    it("locks group entries once the form is submitted and outside blocks handed back", async () => {
      const contact = await sessions.session(f.customerId);
      const groupBlock = await f.catalogBlock(TEAM);
      const other = await f.catalogBlock([{ key: "note", type: T.LongText }]);
      const form = await openForm([groupBlock, other]);
      const entryId = await addEntry(contact, form);
      const target = { formId: form.id, entryId };
      const add = () =>
        addPortalOnboardingGroupEntry(contact, form.id, {
          id: crypto.randomUUID(),
          fieldId: field(form, "team").id,
        });

      await f.setFormStatus(form.id, OnboardingFormStatus.Submitted);
      expect(await add()).toEqual(LOCKED);
      expect(
        await movePortalOnboardingGroupEntry(contact, target, { direction: 1 }),
      ).toEqual(LOCKED);
      expect(await removePortalOnboardingGroupEntry(contact, target)).toEqual(
        LOCKED,
      );

      await f.setFormStatus(form.id, OnboardingFormStatus.ChangesRequested);
      await reopenBlock(form, form.blocks[1].block.id);
      expect(await add()).toEqual(LOCKED);
      expect(await removePortalOnboardingGroupEntry(contact, target)).toEqual(
        LOCKED,
      );

      await reopenBlock(form, form.blocks[0].block.id);
      expect(await add()).toMatchObject({ ok: true });
    });

    it("confirms the booked services with who, when and an optional remark", async () => {
      const contact = await sessions.session(f.customerId, "Ada Lovelace");
      const form = await openForm([
        await f.catalogBlock([{ key: "services", type: T.ProjectServices }]),
      ]);

      expect(
        await confirmPortalOnboardingServices(contact, form.id, {
          confirmed: true,
          note: null,
        }),
      ).toMatchObject({ ok: true, value: { savedByName: "Ada Lovelace" } });
      const confirmed = await f.readFormRow(form.id);
      expect(confirmed).toMatchObject({
        services_confirmed_by_portal_membership_id: contact.membershipId,
        services_note: null,
      });
      expect(confirmed.services_confirmed_at).toBeInstanceOf(Date);
      expect(
        await getPortalOnboardingForm(contact, form.id, Locale.De),
      ).toMatchObject({ servicesConfirmed: true });

      expect(
        await confirmPortalOnboardingServices(contact, form.id, {
          confirmed: true,
          note: "  Bitte noch das Blog-Modul prüfen.  ",
        }),
      ).toMatchObject({ ok: true });
      expect((await f.readFormRow(form.id)).services_note).toBe(
        "Bitte noch das Blog-Modul prüfen.",
      );
    });

    it("rejects a remark without text, an overlong remark and anything but a confirmation", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([{ key: "services", type: T.ProjectServices }]),
      ]);

      for (const input of [
        { confirmed: true, note: "" },
        { confirmed: true, note: "   " },
        { confirmed: true, note: "x".repeat(2_001) },
        { confirmed: false, note: null },
        { confirmed: true },
      ])
        expect(
          await confirmPortalOnboardingServices(
            contact,
            form.id,
            input as Parameters<typeof confirmPortalOnboardingServices>[2],
          ),
        ).toEqual(VALIDATION);
      expect((await f.readFormRow(form.id)).services_confirmed_at).toBeNull();
    });

    it("lets a required services field block the submission until it is confirmed", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await openForm([
        await f.catalogBlock([
          { key: "services", type: T.ProjectServices, overrides: REQUIRED },
        ]),
      ]);

      expect(await submitPortalOnboarding(contact, form.id)).toMatchObject({
        ok: false,
        code: E.RequiredMissing,
        missing: [{ fieldId: field(form, "services").id }],
      });

      await confirmPortalOnboardingServices(contact, form.id, {
        confirmed: true,
        note: null,
      });
      expect(await submitPortalOnboarding(contact, form.id)).toMatchObject({
        ok: true,
        value: { status: OnboardingFormStatus.Submitted },
      });
    });

    it("refuses a confirmation without a services field and after the submission", async () => {
      const contact = await sessions.session(f.customerId);
      const plain = await openForm([
        await f.catalogBlock([{ key: "name", type: T.ShortText }]),
      ]);
      const submitted = await openForm(
        [await f.catalogBlock([{ key: "services", type: T.ProjectServices }])],
        OnboardingFormStatus.Submitted,
      );
      const input = { confirmed: true, note: null } as const;

      expect(
        await confirmPortalOnboardingServices(contact, plain.id, input),
      ).toEqual(VALIDATION);
      expect(
        await confirmPortalOnboardingServices(contact, submitted.id, input),
      ).toEqual(LOCKED);
    });
  },
);
