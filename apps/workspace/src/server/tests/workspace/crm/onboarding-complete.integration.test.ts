import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { CompleteOnboardingFormRequestDto } from "@invessiv/common/contracts/crm/onboarding/complete-onboarding-form-request.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import {
  activities,
  messages,
  onboardingFormServices,
  projectLineItems,
  projects,
  tasks,
} from "@invessiv/db/record-configuration";
import { ONBOARDING_FORM_ACTIVITY_ENTITY } from "@/common/constants/crm/onboarding-form-activity-metadata";
import { addPortalOnboardingGroupEntry } from "@/server/portal/command-handler/add-portal-onboarding-group-entry.command-handler";
import { attachPortalOnboardingFile } from "@/server/portal/command-handler/attach-portal-onboarding-file.command-handler";
import { confirmPortalOnboardingServices } from "@/server/portal/command-handler/confirm-portal-onboarding-services.command-handler";
import { savePortalOnboardingAnswer } from "@/server/portal/command-handler/save-portal-onboarding-answer.command-handler";
import { submitPortalOnboarding } from "@/server/portal/command-handler/submit-portal-onboarding.command-handler";
import { getPortalOnboardingForm } from "@/server/portal/query-handler/get-portal-onboarding-form.query-handler";
import { onboardingProjectStepService } from "@/server/shared/services/onboarding/onboarding-project-step-service";
import { createPortalSessionFixture } from "@/server/tests/support/portal-session-fixture";
import { addOnboardingFormBlock } from "@/server/workspace/crm/command-handler/add-onboarding-form-block.command-handler";
import { completeOnboardingForm } from "@/server/workspace/crm/command-handler/complete-onboarding-form.command-handler";
import { createOnboardingFormField } from "@/server/workspace/crm/command-handler/create-onboarding-form-field.command-handler";
import { moveOnboardingFormBlock } from "@/server/workspace/crm/command-handler/move-onboarding-form-block.command-handler";
import { releaseOnboardingForm } from "@/server/workspace/crm/command-handler/release-onboarding-form.command-handler";
import { removeOnboardingFormBlock } from "@/server/workspace/crm/command-handler/remove-onboarding-form-block.command-handler";
import { requestOnboardingChanges } from "@/server/workspace/crm/command-handler/request-onboarding-changes.command-handler";
import { reviewOnboardingBlock } from "@/server/workspace/crm/command-handler/review-onboarding-block.command-handler";
import { startProjectOnboarding } from "@/server/workspace/crm/command-handler/start-project-onboarding.command-handler";
import { getOnboardingForm } from "@/server/workspace/crm/query-handler/get-onboarding-form.query-handler";
import { createOnboardingIntegrationFixture } from "./support/onboarding-integration-fixture";
import {
  fieldByKey,
  fieldRequestFixture,
} from "./support/questionnaire-definition-fixtures";

vi.mock("server-only", () => ({}));
// Every test talks to the development database several dozen times.
vi.setConfig({ testTimeout: 60_000 });

const FORM_NOT_FOUND = { ok: false, code: OnboardingErrorCode.FormNotFound };
const INVALID_TRANSITION = {
  ok: false,
  code: OnboardingErrorCode.InvalidTransition,
};
const NOT_EDITABLE = { ok: false, code: OnboardingErrorCode.NotEditable };
const CALL_DATE_REQUIRED = {
  ok: false,
  code: OnboardingErrorCode.CallDateRequired,
};
const LOCKED = { ok: false, code: PortalOnboardingErrorCode.Locked };
const CALL_HELD_ON = "2026-09-15";
const TRACK = ["Onboarding", "Design", "Launch"];

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "onboarding completion PostgreSQL integration",
  () => {
    const f = createOnboardingIntegrationFixture();
    const PREFIX = `integration:onboarding-complete:${crypto.randomUUID()}:`;
    const sessions = createPortalSessionFixture(
      () => f.database(),
      f.memberId,
      PREFIX,
    );

    /** A project that still stands at the first step of its track, in the onboarding phase. */
    const freshProject = (
      overrides: Parameters<typeof f.project>[0] = {},
    ): Promise<string> =>
      f.project({
        processSteps: TRACK,
        currentProcessStep: TRACK[0],
        positions: null,
        ...overrides,
      });

    /**
     * A submitted form with one required question, a logo upload and a team group. Unless told
     * otherwise the required question is answered, so the form is ready for completion.
     */
    async function form(
      options: {
        status?: OnboardingFormStatus;
        projectId?: string;
        answered?: boolean;
      } = {},
    ): Promise<OnboardingFormDto> {
      const block = await f.catalogBlock([
        {
          key: "name",
          type: T.ShortText,
          overrides: { requirement: QuestionnaireFieldRequirement.Required },
        },
        { key: "logo", type: T.Files },
        { key: "team", type: T.Group },
        { key: "member_name", type: T.ShortText, parent: "team" },
        { key: "services", type: T.ProjectServices },
      ]);
      const other = await f.catalogBlock([{ key: "note", type: T.LongText }]);
      const template = await f.template([block.id, other.id]);
      const started = f.value(
        await startProjectOnboarding(
          options.projectId ?? (await freshProject()),
          { templateId: template.id },
          f.member(),
        ),
      );
      if (options.answered ?? true)
        await f.answer(started, field(started, "name").id, { value: "Acme" });
      await f.setFormStatus(
        started.id,
        options.status ?? OnboardingFormStatus.Submitted,
      );
      return started;
    }

    const field = (target: OnboardingFormDto, key: string) =>
      fieldByKey(target.blocks[0].block, key);

    async function complete(
      target: OnboardingFormDto,
      input: Partial<CompleteOnboardingFormRequestDto> = {},
      actor = f.member(),
    ) {
      const row = await f.readFormRow(target.id);
      return completeOnboardingForm(
        target.id,
        {
          expectedVersion: row.version,
          callHeldOn: CALL_HELD_ON,
          advancePhase: true,
          ...input,
        },
        actor,
      );
    }

    const snapshot = (formId: string) =>
      f
        .database()
        .select()
        .from(onboardingFormServices)
        .where(eq(onboardingFormServices.form_id, formId))
        .orderBy(onboardingFormServices.position);

    const formTasks = (formId: string) =>
      f
        .database()
        .select()
        .from(tasks)
        .where(eq(tasks.onboarding_form_id, formId));

    async function lineItem(
      projectId: string,
      title: string,
      options: { status?: ProjectLineItemStatus | null; age?: number } = {},
    ): Promise<string> {
      const id = crypto.randomUUID();
      await f
        .database()
        .insert(projectLineItems)
        .values({
          id,
          project_id: projectId,
          source_line_item_template_id: null,
          title,
          description: `${title} description`,
          price_cents: 100,
          pricing_mode: ServicePricingMode.OneTime,
          recurring_interval: null,
          status: options.status ?? null,
          version: 1,
          // The form lists line items in the order they were booked.
          created_at: new Date(Date.now() - (options.age ?? 0) * 1_000),
        });
      return id;
    }

    /** Submits through the portal, so the form gets its collecting task. */
    async function submitted(projectId?: string): Promise<OnboardingFormDto> {
      const contact = await sessions.session(f.customerId);
      const target = await form({
        status: OnboardingFormStatus.Open,
        projectId,
      });
      await confirmPortalOnboardingServices(contact, target.id, {
        confirmed: true,
        note: null,
      });
      const result = await submitPortalOnboarding(contact, target.id);
      if (!result.ok) throw new Error(`expected a submission: ${result.code}`);
      return target;
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      vi.restoreAllMocks();
      await f.cleanup();
      await sessions.cleanup();
    }, 60_000);

    describe("preconditions", () => {
      it("completes only a submitted form", async () => {
        for (const status of [
          OnboardingFormStatus.Draft,
          OnboardingFormStatus.Open,
          OnboardingFormStatus.ChangesRequested,
          OnboardingFormStatus.Completed,
        ]) {
          const target = await form({ status });
          expect(await complete(target)).toEqual(INVALID_TRANSITION);
          expect((await f.readFormRow(target.id)).status).toBe(status);
          expect(await snapshot(target.id)).toEqual([]);
        }
      });

      it("names the visible required answers that are missing", async () => {
        const target = await form({ answered: false });

        expect(await complete(target)).toEqual({
          ok: false,
          code: OnboardingErrorCode.RequiredMissing,
          missing: [
            {
              blockId: target.blocks[0].block.id,
              fieldId: field(target, "name").id,
              groupEntryId: null,
            },
          ],
        });
        expect((await f.readFormRow(target.id)).status).toBe(
          OnboardingFormStatus.Submitted,
        );
      });

      it("needs a call date that is not in the future", async () => {
        const target = await submitted();
        const tomorrow = new Date(Date.now() + 2 * 86_400_000)
          .toISOString()
          .slice(0, 10);

        for (const callHeldOn of ["", tomorrow, "15.09.2026"])
          expect(await complete(target, { callHeldOn })).toEqual(
            CALL_DATE_REQUIRED,
          );
        expect((await f.readFormRow(target.id)).status).toBe(
          OnboardingFormStatus.Submitted,
        );
      });

      it("refuses a request without its fields", async () => {
        const target = await submitted();
        for (const input of [
          { expectedVersion: 1 },
          { expectedVersion: 1, callHeldOn: CALL_HELD_ON },
          { expectedVersion: 0, callHeldOn: CALL_HELD_ON, advancePhase: true },
          {
            expectedVersion: 1,
            callHeldOn: CALL_HELD_ON,
            advancePhase: true,
            extra: 1,
          },
        ])
          expect(
            await completeOnboardingForm(
              target.id,
              input as CompleteOnboardingFormRequestDto,
              f.member(),
            ),
          ).toMatchObject({
            ok: false,
            code: OnboardingErrorCode.ValidationError,
          });
      });

      it("answers a stale form version with the current form", async () => {
        const target = await submitted();
        const row = await f.readFormRow(target.id);

        expect(
          await complete(target, { expectedVersion: row.version + 3 }),
        ).toMatchObject({
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          conflict: {
            currentVersion: row.version,
            current: { id: target.id, status: OnboardingFormStatus.Submitted },
          },
        });
      });
    });

    describe("completing", () => {
      it("freezes the services and closes form, task and phase in one step", async () => {
        const projectId = await freshProject();
        const second = await lineItem(projectId, "Wartung", { age: 10 });
        const first = await lineItem(projectId, "Landingpage", { age: 20 });
        await lineItem(projectId, "Abgelehnt", {
          age: 30,
          status: ProjectLineItemStatus.Rejected,
        });
        const target = await submitted(projectId);
        const before = await f.readFormRow(target.id);

        const result = await complete(target);

        expect(result).toMatchObject({
          ok: true,
          value: {
            status: OnboardingFormStatus.Completed,
            callHeldOn: CALL_HELD_ON,
            completedByMemberId: f.memberId,
            version: before.version + 1,
            services: [
              { projectLineItemId: first, title: "Landingpage", position: 0 },
              { projectLineItemId: second, title: "Wartung", position: 1 },
            ],
          },
        });
        expect(await f.readFormRow(target.id)).toMatchObject({
          status: OnboardingFormStatus.Completed,
          call_held_on: CALL_HELD_ON,
          completed_by_member_id: f.memberId,
          completed_at: expect.any(Date),
        });
        expect(await snapshot(target.id)).toMatchObject([
          {
            project_line_item_id: first,
            title: "Landingpage",
            description: "Landingpage description",
            position: 0,
          },
          {
            project_line_item_id: second,
            title: "Wartung",
            description: "Wartung description",
            position: 1,
          },
        ]);
        expect(await formTasks(target.id)).toMatchObject([
          {
            status: TaskStatus.Done,
            completed_by_member_id: f.memberId,
            completed_at: expect.any(Date),
            completed_by_portal_membership_id: null,
          },
        ]);
        expect(await f.readProject(projectId)).toMatchObject({
          phase: ProjectPhase.Design,
          current_process_step: TRACK[1],
          version: 2,
        });

        const logged = await f
          .database()
          .select()
          .from(activities)
          .where(
            and(
              eq(activities.project_id, projectId),
              eq(activities.type, ActivityType.StatusChange),
            ),
          );
        expect(
          logged.find(
            (activity) =>
              (activity.metadata as { entity?: string }).entity ===
              ONBOARDING_FORM_ACTIVITY_ENTITY,
          )?.metadata,
        ).toMatchObject({
          onboarding_form_id: target.id,
          previous_status: OnboardingFormStatus.Submitted,
          next_status: OnboardingFormStatus.Completed,
        });
        const chat = (
          await f
            .database()
            .select({ body: messages.body })
            .from(messages)
            .where(eq(messages.customer_id, f.customerId))
        ).map((message) => message.body);
        expect(chat).toContain(SystemMessageKey.OnboardingCompleted);
        expect(chat).toContain(SystemMessageKey.ProjectPhaseChanged);
      });

      it("does not block on unreviewed blocks and keeps their state", async () => {
        const target = await submitted();

        expect(await complete(target)).toMatchObject({
          ok: true,
          value: {
            blocks: [
              { reviewStatus: OnboardingBlockReviewStatus.Pending },
              { reviewStatus: OnboardingBlockReviewStatus.Pending },
            ],
          },
        });
      });

      it("leaves the phase alone when the project is past the onboarding or the box is unticked", async () => {
        const developing = await freshProject();
        await f
          .database()
          .update(projects)
          .set({ phase: ProjectPhase.Development })
          .where(eq(projects.id, developing));
        const unticked = await freshProject();

        expect(await complete(await submitted(developing))).toMatchObject({
          ok: true,
        });
        expect(
          await complete(await submitted(unticked), { advancePhase: false }),
        ).toMatchObject({ ok: true });

        expect(await f.readProject(developing)).toMatchObject({
          phase: ProjectPhase.Development,
          current_process_step: TRACK[0],
          version: 1,
        });
        expect(await f.readProject(unticked)).toMatchObject({
          phase: ProjectPhase.Onboarding,
          current_process_step: TRACK[0],
          version: 1,
        });
      });

      it("moves the phase but not a step someone already advanced", async () => {
        const projectId = await freshProject({ currentProcessStep: TRACK[2] });

        expect(await complete(await submitted(projectId))).toMatchObject({
          ok: true,
        });
        expect(await f.readProject(projectId)).toMatchObject({
          phase: ProjectPhase.Design,
          current_process_step: TRACK[2],
        });
      });

      it("closes a task in progress and leaves one changed by hand", async () => {
        const inProgress = await submitted();
        const cancelled = await submitted();
        const setTask = (formId: string, status: TaskStatus) =>
          f
            .database()
            .update(tasks)
            .set({ status })
            .where(eq(tasks.onboarding_form_id, formId));
        await setTask(inProgress.id, TaskStatus.InProgress);
        await setTask(cancelled.id, TaskStatus.Cancelled);

        expect(await complete(inProgress)).toMatchObject({ ok: true });
        expect(await complete(cancelled)).toMatchObject({ ok: true });

        expect(await formTasks(inProgress.id)).toMatchObject([
          { status: TaskStatus.Done },
        ]);
        expect(await formTasks(cancelled.id)).toMatchObject([
          { status: TaskStatus.Cancelled, completed_at: null },
        ]);
      });

      it("writes nothing when a later step of the completion fails", async () => {
        const projectId = await freshProject();
        await lineItem(projectId, "Landingpage");
        const target = await submitted(projectId);
        const failing = vi
          .spyOn(onboardingProjectStepService, "advancePastOnboarding")
          .mockRejectedValueOnce(new Error("step failed"));

        await expect(complete(target)).rejects.toThrow("step failed");
        failing.mockRestore();

        expect(await f.readFormRow(target.id)).toMatchObject({
          status: OnboardingFormStatus.Submitted,
          completed_at: null,
          call_held_on: null,
        });
        expect(await snapshot(target.id)).toEqual([]);
        expect(await formTasks(target.id)).toMatchObject([
          { status: TaskStatus.Open },
        ]);
        expect(await f.readProject(projectId)).toMatchObject({
          phase: ProjectPhase.Onboarding,
          version: 1,
        });
      });
    });

    describe("after completion", () => {
      it("keeps the frozen services whatever happens to the project's line items", async () => {
        const projectId = await freshProject();
        const kept = await lineItem(projectId, "Landingpage", { age: 10 });
        const target = await submitted(projectId);
        await complete(target);

        await lineItem(projectId, "Nachträglich gebucht");
        await f
          .database()
          .update(projectLineItems)
          .set({ title: "Umbenannt", updated_at: new Date() })
          .where(eq(projectLineItems.id, kept));

        const read = await getOnboardingForm(target.id, f.member());
        expect(read).toMatchObject({
          servicesChangedSinceConfirmation: false,
          services: [{ projectLineItemId: kept, title: "Landingpage" }],
        });
        expect(read?.services).toHaveLength(1);
      });

      it("refuses every internal write", async () => {
        const target = await submitted();
        const extra = await f.catalogBlock();
        await complete(target);
        const row = await f.readFormRow(target.id);
        const block = target.blocks[0].block;
        const actor = f.member();

        for (const run of [
          () =>
            addOnboardingFormBlock(
              target.id,
              { catalogBlockId: extra.id, expectedFormVersion: row.version },
              actor,
            ),
          () =>
            removeOnboardingFormBlock(
              target.id,
              block.id,
              { expectedFormVersion: row.version },
              actor,
            ),
          () =>
            moveOnboardingFormBlock(
              target.id,
              block.id,
              { direction: 1, expectedFormVersion: row.version },
              actor,
            ),
          () =>
            createOnboardingFormField(
              target.id,
              block.id,
              fieldRequestFixture("extra", T.ShortText, block.version),
              actor,
            ),
        ])
          expect(await run()).toEqual(NOT_EDITABLE);

        for (const run of [
          () =>
            reviewOnboardingBlock(
              target.id,
              block.id,
              {
                reviewStatus: OnboardingBlockReviewStatus.Complete,
                expectedVersion: 1,
              },
              actor,
            ),
          () =>
            requestOnboardingChanges(
              target.id,
              { expectedVersion: row.version },
              actor,
            ),
          () =>
            releaseOnboardingForm(
              target.id,
              { expectedVersion: row.version, acknowledgeWarnings: true },
              actor,
            ),
          () => complete(target),
        ])
          expect(await run()).toEqual(INVALID_TRANSITION);

        expect(await f.readFormRow(target.id)).toEqual(row);
      });

      it("refuses every portal write and still shows the form", async () => {
        const contact = await sessions.session(f.customerId);
        const target = await submitted();
        const fileId = await f.answerFile(target, field(target, "logo").id, 0);
        await complete(target);
        const row = await f.readFormRow(target.id);

        for (const run of [
          () =>
            savePortalOnboardingAnswer(contact, target.id, {
              fieldId: field(target, "name").id,
              groupEntryId: null,
              values: ["Other"],
            }),
          () =>
            addPortalOnboardingGroupEntry(contact, target.id, {
              id: crypto.randomUUID(),
              fieldId: field(target, "team").id,
            }),
          () =>
            attachPortalOnboardingFile(contact, target.id, {
              fieldId: field(target, "logo").id,
              groupEntryId: null,
              fileId,
            }),
          () =>
            confirmPortalOnboardingServices(contact, target.id, {
              confirmed: true,
              note: "Später",
            }),
          () => submitPortalOnboarding(contact, target.id),
        ])
          expect(await run()).toEqual(LOCKED);

        expect(await f.readFormRow(target.id)).toEqual(row);
        expect(
          await getPortalOnboardingForm(contact, target.id, Locale.De),
        ).toMatchObject({
          status: OnboardingFormStatus.Completed,
          editableBlockIds: [],
          completedAt: expect.any(String),
        });
      });

      it("pre-fills the next project of the customer from the completed form", async () => {
        const block = await f.catalogBlock(
          [{ key: "slogan", type: T.ShortText }],
          { carryOver: true },
        );
        const template = await f.template([block.id]);
        const previous = f.value(
          await startProjectOnboarding(
            await freshProject(),
            { templateId: template.id },
            f.member(),
          ),
        );
        await f.answer(previous, previous.blocks[0].block.fields[0].id, {
          value: "Klar und nah",
        });
        await f.setFormStatus(previous.id, OnboardingFormStatus.Submitted);
        expect(await complete(previous)).toMatchObject({ ok: true });

        const next = f.value(
          await startProjectOnboarding(
            await freshProject(),
            { templateId: template.id },
            f.member(),
          ),
        );

        expect(next.answers).toMatchObject([
          {
            fieldId: next.blocks[0].block.fields[0].id,
            value: "Klar und nah",
          },
        ]);
      });
    });

    it("hides the form from members without projects.write and outside their scope", async () => {
      const target = await submitted();
      const foreign = await form({
        projectId: await freshProject({ customerId: f.foreignCustomerId }),
      });
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

      for (const [candidate, actor] of [
        [foreign, customerBound],
        [target, projectBound],
        [target, reader],
      ] as const) {
        expect(await complete(candidate, {}, actor)).toEqual(FORM_NOT_FOUND);
        expect((await f.readFormRow(candidate.id)).status).toBe(
          OnboardingFormStatus.Submitted,
        );
      }
      expect(await complete(target, {}, customerBound)).toMatchObject({
        ok: true,
      });
    });
  },
);
