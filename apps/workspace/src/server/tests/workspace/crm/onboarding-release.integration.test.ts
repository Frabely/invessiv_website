import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { OnboardingReleaseWarningKind } from "@invessiv/common/constants/crm/onboarding/onboarding-release-warning-kinds";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import {
  activities,
  messages,
  people,
  portalMemberships,
} from "@invessiv/db/record-configuration";
import { ONBOARDING_FORM_ACTIVITY_ENTITY } from "@/common/constants/crm/onboarding-form-activity-metadata";
import { getPortalOnboardingForm } from "@/server/portal/query-handler/get-portal-onboarding-form.query-handler";
import { messageService } from "@/server/shared/services/message/message-service";
import { createPortalSessionFixture } from "@/server/tests/support/portal-session-fixture";
import { addOnboardingFormBlock } from "@/server/workspace/crm/command-handler/add-onboarding-form-block.command-handler";
import { createOnboardingFormField } from "@/server/workspace/crm/command-handler/create-onboarding-form-field.command-handler";
import { releaseOnboardingForm } from "@/server/workspace/crm/command-handler/release-onboarding-form.command-handler";
import { startProjectOnboarding } from "@/server/workspace/crm/command-handler/start-project-onboarding.command-handler";
import { createOnboardingIntegrationFixture } from "./support/onboarding-integration-fixture";
import { fieldRequestFixture } from "./support/questionnaire-definition-fixtures";

vi.mock("server-only", () => ({}));
// Every test talks to the development database several dozen times.
vi.setConfig({ testTimeout: 60_000 });

const FORM_NOT_FOUND = { ok: false, code: OnboardingErrorCode.FormNotFound };
const INVALID_TRANSITION = {
  ok: false,
  code: OnboardingErrorCode.InvalidTransition,
};
const INVALID_CONFIG = {
  ok: false,
  code: QuestionnaireErrorCode.InvalidFieldConfig,
};

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "onboarding release PostgreSQL integration",
  () => {
    const f = createOnboardingIntegrationFixture();
    const PREFIX = `integration:onboarding-release:${crypto.randomUUID()}:`;
    const sessions = createPortalSessionFixture(
      () => f.database(),
      f.memberId,
      PREFIX,
    );

    /** A draft built from the given catalog blocks; the fixture customer has a German contact. */
    async function draft(
      blocks: readonly QuestionnaireBlockDto[],
      projectId?: string,
    ): Promise<OnboardingFormDto> {
      return f.value(
        await startProjectOnboarding(
          projectId ?? (await f.project()),
          {
            templateId:
              blocks.length > 0
                ? (await f.template(blocks.map((block) => block.id))).id
                : null,
          },
          f.member(),
        ),
      );
    }

    const askName = () => f.catalogBlock([{ key: "name", type: T.ShortText }]);

    const release = (
      form: OnboardingFormDto,
      overrides: Partial<Parameters<typeof releaseOnboardingForm>[1]> = {},
      actor = f.member(),
    ) =>
      releaseOnboardingForm(
        form.id,
        {
          expectedVersion: form.version,
          acknowledgeWarnings: false,
          ...overrides,
        },
        actor,
      );

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      vi.restoreAllMocks();
      await f.cleanup();
      await sessions.cleanup();
    }, 60_000);

    it("opens a draft for the customer with who, when, activity and chat notice", async () => {
      const contact = await sessions.session(f.customerId);
      const form = await draft([await askName()]);
      expect(
        await getPortalOnboardingForm(contact, form.id, Locale.De),
      ).toBeNull();

      const result = await release(form);

      expect(result).toMatchObject({
        ok: true,
        value: {
          id: form.id,
          status: OnboardingFormStatus.Open,
          releasedByMemberId: f.memberId,
          version: form.version + 1,
        },
      });
      const row = await f.readFormRow(form.id);
      expect(row.status).toBe(OnboardingFormStatus.Open);
      expect(row.released_at).toBeInstanceOf(Date);
      expect(row.released_by_member_id).toBe(f.memberId);

      const logged = await f
        .database()
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.project_id, form.projectId),
            eq(activities.type, ActivityType.StatusChange),
          ),
        );
      expect(logged).toHaveLength(1);
      expect(logged[0].metadata).toMatchObject({
        entity: ONBOARDING_FORM_ACTIVITY_ENTITY,
        onboarding_form_id: form.id,
        previous_status: OnboardingFormStatus.Draft,
        next_status: OnboardingFormStatus.Open,
      });
      const chat = await f
        .database()
        .select({ body: messages.body })
        .from(messages)
        .where(eq(messages.customer_id, f.customerId));
      expect(chat.map((message) => message.body)).toContain(
        SystemMessageKey.OnboardingReleased,
      );
      expect(
        await getPortalOnboardingForm(contact, form.id, Locale.De),
      ).toMatchObject({ status: OnboardingFormStatus.Open });
    });

    it("keeps the release when the chat notice fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const form = await draft([await askName()]);
      const failure = vi
        .spyOn(messageService, "appendSystemMessage")
        .mockRejectedValue(new Error("chat down"));

      expect(await release(form)).toMatchObject({ ok: true });
      expect((await f.readFormRow(form.id)).status).toBe(
        OnboardingFormStatus.Open,
      );
      failure.mockRestore();
    });

    it("blocks a form without blocks, a block without fields and a group without sub-fields", async () => {
      const empty = await draft([]);
      const hollowBlock = await draft([await f.catalogBlock()]);
      const hollowGroup = await draft([
        await f.catalogBlock([
          { key: "name", type: T.ShortText },
          { key: "team", type: T.Group },
        ]),
      ]);

      for (const form of [empty, hollowBlock, hollowGroup]) {
        expect(await release(form, { acknowledgeWarnings: true })).toEqual(
          INVALID_CONFIG,
        );
        expect((await f.readFormRow(form.id)).status).toBe(
          OnboardingFormStatus.Draft,
        );
      }
    });

    it("waits for an acknowledgement when the customer has no portal contact", async () => {
      const form = await draft(
        [await askName()],
        await f.project({ customerId: f.foreignCustomerId }),
      );

      expect(await release(form)).toEqual({
        ok: false,
        code: OnboardingErrorCode.ReleaseWarnings,
        warnings: [{ kind: OnboardingReleaseWarningKind.NoPortalAccess }],
      });
      expect((await f.readFormRow(form.id)).status).toBe(
        OnboardingFormStatus.Draft,
      );

      expect(await release(form, { acknowledgeWarnings: true })).toMatchObject({
        ok: true,
        value: { status: OnboardingFormStatus.Open },
      });
    });

    it("names the block that lacks the language of an active contact", async () => {
      const english = await sessions.session(f.customerId);
      await f
        .database()
        .update(people)
        .set({ preferred_locale: Locale.En })
        .where(eq(people.id, english.personId));
      const started = await draft([await askName()]);
      const form = f.value(
        await addOnboardingFormBlock(
          started.id,
          {
            key: `${f.keyPrefix}_german_only`,
            translations: { de: { title: "Nur deutsch", intro: null } },
            expectedFormVersion: started.version,
          },
          f.member(),
        ),
      );
      const germanOnly = form.blocks[1].block;
      f.value(
        await createOnboardingFormField(
          form.id,
          germanOnly.id,
          fieldRequestFixture("note", T.LongText, germanOnly.version, {
            translations: { de: { label: "Notiz", help: null } },
          }),
          f.member(),
        ),
      );
      const current = (await f.readFormRow(form.id)).version;

      expect(await release(form, { expectedVersion: current })).toEqual({
        ok: false,
        code: OnboardingErrorCode.ReleaseWarnings,
        warnings: [
          {
            kind: OnboardingReleaseWarningKind.MissingTranslation,
            blockId: germanOnly.id,
            locale: Locale.En,
          },
        ],
      });

      // A revoked contact no longer reads the form, so its language stops counting.
      await f
        .database()
        .update(portalMemberships)
        .set({ revoked_at: new Date() })
        .where(eq(portalMemberships.id, english.membershipId));
      expect(await release(form, { expectedVersion: current })).toMatchObject({
        ok: true,
      });
    });

    it("refuses a second release and a form that is already with the customer", async () => {
      const form = await draft([await askName()]);
      expect(await release(form)).toMatchObject({ ok: true });

      expect(await release(form)).toEqual(INVALID_TRANSITION);
      expect(
        await release(form, { expectedVersion: form.version + 1 }),
      ).toEqual(INVALID_TRANSITION);

      await f.setFormStatus(form.id, OnboardingFormStatus.Submitted);
      expect(
        await release(form, { expectedVersion: form.version + 1 }),
      ).toEqual(INVALID_TRANSITION);
    });

    it("answers a stale version with the current form and releases nothing", async () => {
      const form = await draft([await askName()]);

      expect(
        await release(form, { expectedVersion: form.version + 5 }),
      ).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          currentVersion: form.version,
          current: { id: form.id, status: OnboardingFormStatus.Draft },
        },
      });
      expect((await f.readFormRow(form.id)).status).toBe(
        OnboardingFormStatus.Draft,
      );
    });

    it("rejects a request without version or acknowledgement flag", async () => {
      const form = await draft([await askName()]);

      for (const input of [
        { expectedVersion: form.version },
        { acknowledgeWarnings: true },
        { expectedVersion: 0, acknowledgeWarnings: true },
        { expectedVersion: form.version, acknowledgeWarnings: true, extra: 1 },
      ])
        expect(
          await releaseOnboardingForm(
            form.id,
            input as Parameters<typeof releaseOnboardingForm>[1],
            f.member(),
          ),
        ).toMatchObject({
          ok: false,
          code: OnboardingErrorCode.ValidationError,
        });
      expect(await release({ ...form, id: "not-a-uuid" })).toEqual(
        FORM_NOT_FOUND,
      );
    });

    it("hides the form from members without projects.write and outside their scope", async () => {
      const form = await draft([await askName()]);
      const foreign = await draft(
        [await askName()],
        await f.project({ customerId: f.foreignCustomerId }),
      );
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
        [foreign, customerBound],
        [form, projectBound],
        [form, reader],
      ] as const) {
        expect(
          await release(target, { acknowledgeWarnings: true }, actor),
        ).toEqual(FORM_NOT_FOUND);
        expect((await f.readFormRow(target.id)).status).toBe(
          OnboardingFormStatus.Draft,
        );
      }
      expect(await release(form, {}, customerBound)).toMatchObject({
        ok: true,
      });
    });
  },
);
