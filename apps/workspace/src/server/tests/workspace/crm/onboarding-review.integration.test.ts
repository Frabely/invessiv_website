import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { OnboardingBlockReviewStatus as S } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode as M } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { ReviewOnboardingBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/review-onboarding-block-request.dto";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import {
  activities,
  messages,
  onboardingFormBlocks,
  projects,
  tasks,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { ONBOARDING_FORM_ACTIVITY_ENTITY } from "@/common/constants/crm/onboarding-form-activity-metadata";
import { savePortalOnboardingAnswer } from "@/server/portal/command-handler/save-portal-onboarding-answer.command-handler";
import { submitPortalOnboarding } from "@/server/portal/command-handler/submit-portal-onboarding.command-handler";
import { getPortalOnboardingForm } from "@/server/portal/query-handler/get-portal-onboarding-form.query-handler";
import { createPortalSessionFixture } from "@/server/tests/support/portal-session-fixture";
import { requestOnboardingChanges } from "@/server/workspace/crm/command-handler/request-onboarding-changes.command-handler";
import { reviewOnboardingBlock } from "@/server/workspace/crm/command-handler/review-onboarding-block.command-handler";
import { startProjectOnboarding } from "@/server/workspace/crm/command-handler/start-project-onboarding.command-handler";
import { getProjectOnboarding } from "@/server/workspace/crm/query-handler/get-project-onboarding.query-handler";
import { createOnboardingIntegrationFixture } from "./support/onboarding-integration-fixture";

vi.mock("server-only", () => ({}));
// Every test talks to the development database several dozen times.
vi.setConfig({ testTimeout: 60_000 });

const FORM_NOT_FOUND = { ok: false, code: OnboardingErrorCode.FormNotFound };
const BLOCK_NOT_FOUND = {
  ok: false,
  code: QuestionnaireErrorCode.BlockNotFound,
};
const INVALID_TRANSITION = {
  ok: false,
  code: OnboardingErrorCode.InvalidTransition,
};

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "onboarding review PostgreSQL integration",
  () => {
    const f = createOnboardingIntegrationFixture();
    const PREFIX = `integration:onboarding-review:${crypto.randomUUID()}:`;
    const sessions = createPortalSessionFixture(
      () => f.database(),
      f.memberId,
      PREFIX,
    );
    const secondUserId = crypto.randomUUID();
    const secondMemberId = crypto.randomUUID();

    /** A form of two one-question blocks on a fresh project, moved straight to a status. */
    async function form(
      status: OnboardingFormStatus = OnboardingFormStatus.Submitted,
      projectId?: string,
    ): Promise<OnboardingFormDto> {
      const blocks = [
        await f.catalogBlock([{ key: "name", type: T.ShortText }]),
        await f.catalogBlock([{ key: "note", type: T.LongText }]),
      ];
      const template = await f.template(blocks.map((block) => block.id));
      const started = f.value(
        await startProjectOnboarding(
          projectId ?? (await f.project()),
          { templateId: template.id },
          f.member(),
        ),
      );
      await f.setFormStatus(started.id, status);
      return started;
    }

    const blockId = (target: OnboardingFormDto, index: number) =>
      target.blocks[index].block.id;

    async function steps(formId: string) {
      return f
        .database()
        .select()
        .from(onboardingFormBlocks)
        .where(eq(onboardingFormBlocks.form_id, formId))
        .orderBy(onboardingFormBlocks.position);
    }

    /** Reviews the block at `index` with the version the database holds right now. */
    async function review(
      target: OnboardingFormDto,
      index: number,
      input: Partial<ReviewOnboardingBlockRequestDto> & object,
      actor = f.member(),
    ) {
      const [current] = (await steps(target.id)).filter(
        (step) => step.block_id === blockId(target, index),
      );
      return reviewOnboardingBlock(
        target.id,
        blockId(target, index),
        {
          expectedVersion: current.version,
          ...input,
        } as ReviewOnboardingBlockRequestDto,
        actor,
      );
    }

    const askCustomer = (note = "Welche Domain meint ihr?") => ({
      reviewStatus: S.Clarification,
      clarificationMode: M.Customer,
      note,
    });
    const askInCall = (note = "Zielgruppe besprechen") => ({
      reviewStatus: S.Clarification,
      clarificationMode: M.Call,
      note,
    });

    async function requestChanges(
      target: OnboardingFormDto,
      actor = f.member(),
    ) {
      const row = await f.readFormRow(target.id);
      return requestOnboardingChanges(
        target.id,
        { expectedVersion: row.version },
        actor,
      );
    }

    const formTasks = (formId: string) =>
      f
        .database()
        .select()
        .from(tasks)
        .where(eq(tasks.onboarding_form_id, formId));

    async function setMemberActive(memberId: string, active: boolean) {
      await f
        .database()
        .update(workspaceMembers)
        .set({ active })
        .where(eq(workspaceMembers.id, memberId));
    }

    beforeAll(async () => {
      await f.setup();
      await f
        .database()
        .insert(users)
        .values({
          id: secondUserId,
          clerk_user_id: `${PREFIX}second`,
          primary_email: "second@example.test",
          display_name: `${PREFIX}second`,
          active: true,
          version: 1,
        });
      await f.database().insert(workspaceMembers).values({
        id: secondMemberId,
        user_id: secondUserId,
        active: true,
        version: 1,
      });
    }, 60_000);

    afterAll(async () => {
      vi.restoreAllMocks();
      await f.cleanup();
      await sessions.cleanup();
      const db = f.database();
      if (!db) return;
      await db
        .delete(workspaceMembers)
        .where(inArray(workspaceMembers.id, [secondMemberId]));
      await db.delete(users).where(inArray(users.id, [secondUserId]));
    }, 60_000);

    describe("collecting task", () => {
      it("creates one internal task with the first submission and none with the second", async () => {
        const contact = await sessions.session(f.customerId);
        const target = await form(OnboardingFormStatus.Open);

        expect(await submitPortalOnboarding(contact, target.id)).toMatchObject({
          ok: true,
        });
        const [task, ...rest] = await formTasks(target.id);
        expect(rest).toHaveLength(0);
        expect(task).toMatchObject({
          project_id: target.projectId,
          title: "Onboarding prüfen",
          status: TaskStatus.Open,
          action_side: TaskActionSide.Internal,
          visible_to_customer: false,
          assignee_member_id: f.memberId,
          feedback_round_id: null,
        });

        expect(await review(target, 0, askCustomer())).toMatchObject({
          ok: true,
        });
        expect(await requestChanges(target)).toMatchObject({ ok: true });
        // The change request leaves the task as it is.
        expect(await formTasks(target.id)).toMatchObject([
          { id: task.id, status: TaskStatus.Open, version: task.version },
        ]);

        expect(await submitPortalOnboarding(contact, target.id)).toMatchObject({
          ok: true,
        });
        expect(await formTasks(target.id)).toMatchObject([
          { id: task.id, status: TaskStatus.Open, version: task.version },
        ]);
      });

      it("leaves a task someone changed by hand untouched on the next submission", async () => {
        const contact = await sessions.session(f.customerId);
        const target = await form(OnboardingFormStatus.Open);
        await submitPortalOnboarding(contact, target.id);
        await f
          .database()
          .update(tasks)
          .set({ status: TaskStatus.Cancelled })
          .where(eq(tasks.onboarding_form_id, target.id));

        await review(target, 0, askCustomer());
        await requestChanges(target);
        await submitPortalOnboarding(contact, target.id);

        expect(await formTasks(target.id)).toMatchObject([
          { status: TaskStatus.Cancelled },
        ]);
      });

      it("assigns the customer owner when the project owner is inactive", async () => {
        const contact = await sessions.session(f.customerId);
        const projectId = await f.project();
        await f
          .database()
          .update(projects)
          .set({ owner_member_id: secondMemberId })
          .where(eq(projects.id, projectId));
        const owned = await form(OnboardingFormStatus.Open, projectId);
        await submitPortalOnboarding(contact, owned.id);
        expect(await formTasks(owned.id)).toMatchObject([
          { assignee_member_id: secondMemberId },
        ]);

        const fallbackProjectId = await f.project();
        await f
          .database()
          .update(projects)
          .set({ owner_member_id: secondMemberId })
          .where(eq(projects.id, fallbackProjectId));
        const fallback = await form(
          OnboardingFormStatus.Open,
          fallbackProjectId,
        );
        await setMemberActive(secondMemberId, false);
        try {
          await submitPortalOnboarding(contact, fallback.id);
        } finally {
          await setMemberActive(secondMemberId, true);
        }
        expect(await formTasks(fallback.id)).toMatchObject([
          { assignee_member_id: f.memberId },
        ]);
      });

      it("submits without a task when no owner is active", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const contact = await sessions.session(f.customerId);
        const target = await form(OnboardingFormStatus.Open);
        await setMemberActive(f.memberId, false);
        try {
          expect(
            await submitPortalOnboarding(contact, target.id),
          ).toMatchObject({ ok: true });
        } finally {
          await setMemberActive(f.memberId, true);
        }
        expect(await formTasks(target.id)).toHaveLength(0);
        expect((await f.readFormRow(target.id)).status).toBe(
          OnboardingFormStatus.Submitted,
        );
      });
    });

    describe("reviewing a block", () => {
      it("stores result, reviewer and time, and takes them back with pending", async () => {
        const target = await form();

        const completed = await review(target, 0, { reviewStatus: S.Complete });
        expect(completed).toMatchObject({
          ok: true,
          value: {
            // Reviews of single blocks do not advance the form.
            version: target.version,
            blocks: [
              {
                reviewStatus: S.Complete,
                clarificationMode: null,
                reviewNote: null,
                reviewedByMemberId: f.memberId,
                version: 2,
              },
              { reviewStatus: S.Pending, version: 1 },
            ],
          },
        });

        expect(await review(target, 0, askInCall())).toMatchObject({
          ok: true,
          value: {
            blocks: [
              {
                reviewStatus: S.Clarification,
                clarificationMode: M.Call,
                reviewNote: "Zielgruppe besprechen",
                version: 3,
              },
              {},
            ],
          },
        });

        await review(target, 0, { reviewStatus: S.Pending });
        expect((await steps(target.id))[0]).toMatchObject({
          review_status: S.Pending,
          clarification_mode: null,
          review_note: null,
          reviewed_by_member_id: null,
          reviewed_at: null,
          version: 4,
        });
      });

      it("is closed while the customer works on the form and once it is completed", async () => {
        for (const status of [
          OnboardingFormStatus.Draft,
          OnboardingFormStatus.Open,
          OnboardingFormStatus.ChangesRequested,
          OnboardingFormStatus.Completed,
        ]) {
          const target = await form(status);
          expect(await review(target, 0, { reviewStatus: S.Complete })).toEqual(
            INVALID_TRANSITION,
          );
          expect((await steps(target.id))[0].review_status).toBe(S.Pending);
        }
      });

      it("refuses a question without its way or its text", async () => {
        const target = await form();
        for (const input of [
          { reviewStatus: S.Clarification, clarificationMode: M.Customer },
          { reviewStatus: S.Clarification, note: "Bitte ergänzen" },
          {
            reviewStatus: S.Clarification,
            clarificationMode: M.Call,
            note: "  ",
          },
        ])
          expect(await review(target, 0, input)).toMatchObject({
            ok: false,
            code: OnboardingErrorCode.ValidationError,
          });
        expect((await steps(target.id))[0].review_status).toBe(S.Pending);
      });

      it("answers a stale version with the current form and writes nothing", async () => {
        const target = await form();
        await review(target, 0, { reviewStatus: S.Complete });

        expect(
          await reviewOnboardingBlock(
            target.id,
            blockId(target, 0),
            { reviewStatus: S.Pending, expectedVersion: 1 },
            f.member(),
          ),
        ).toMatchObject({
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          conflict: {
            currentVersion: 2,
            current: {
              id: target.id,
              blocks: [{ reviewStatus: S.Complete }, {}],
            },
          },
        });
        expect((await steps(target.id))[0].review_status).toBe(S.Complete);
      });

      it("treats a block of another form and an unknown block as missing", async () => {
        const target = await form();
        const other = await form();
        const input = { reviewStatus: S.Complete, expectedVersion: 1 } as const;

        for (const id of [blockId(other, 0), crypto.randomUUID(), "not-a-uuid"])
          expect(
            await reviewOnboardingBlock(target.id, id, input, f.member()),
          ).toEqual(BLOCK_NOT_FOUND);
        expect(
          await reviewOnboardingBlock(
            "not-a-uuid",
            blockId(target, 0),
            input,
            f.member(),
          ),
        ).toEqual(FORM_NOT_FOUND);
      });
    });

    describe("requesting changes", () => {
      it("needs a block with a question for the customer", async () => {
        const target = await form();
        await review(target, 0, { reviewStatus: S.Complete });
        await review(target, 1, askInCall());

        expect(await requestChanges(target)).toEqual({
          ok: false,
          code: OnboardingErrorCode.ReviewIncomplete,
        });
        expect((await f.readFormRow(target.id)).status).toBe(
          OnboardingFormStatus.Submitted,
        );
      });

      it("hands the form back with activity and chat notice and locks the review", async () => {
        const target = await form();
        await review(target, 0, askCustomer());
        await review(target, 1, askInCall());

        expect(await requestChanges(target)).toMatchObject({
          ok: true,
          value: {
            status: OnboardingFormStatus.ChangesRequested,
            version: target.version + 1,
          },
        });

        const logged = await f
          .database()
          .select()
          .from(activities)
          .where(
            and(
              eq(activities.project_id, target.projectId),
              eq(activities.type, ActivityType.StatusChange),
            ),
          );
        expect(logged).toHaveLength(1);
        expect(logged[0].metadata).toMatchObject({
          entity: ONBOARDING_FORM_ACTIVITY_ENTITY,
          onboarding_form_id: target.id,
          previous_status: OnboardingFormStatus.Submitted,
          next_status: OnboardingFormStatus.ChangesRequested,
          // Only the question that went to the customer; the one for the call stays on the block.
          clarifications: [
            { block_id: blockId(target, 0), note: "Welche Domain meint ihr?" },
          ],
        });
        const chat = await f
          .database()
          .select({ body: messages.body, metadata: messages.metadata })
          .from(messages)
          .where(eq(messages.customer_id, f.customerId));
        expect(
          chat.find(
            (message) =>
              message.body === SystemMessageKey.OnboardingChangesRequested,
          )?.metadata,
        ).toMatchObject({ blockTitles: "Baustein" });

        expect(await requestChanges(target)).toEqual(INVALID_TRANSITION);
        expect(await review(target, 1, { reviewStatus: S.Complete })).toEqual(
          INVALID_TRANSITION,
        );
      });

      it("answers a stale form version with the current form", async () => {
        const target = await form();
        await review(target, 0, askCustomer());

        expect(
          await requestOnboardingChanges(
            target.id,
            { expectedVersion: target.version + 5 },
            f.member(),
          ),
        ).toMatchObject({
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          conflict: {
            currentVersion: target.version,
            current: { status: OnboardingFormStatus.Submitted },
          },
        });
        expect(
          await requestOnboardingChanges(
            target.id,
            {} as Parameters<typeof requestOnboardingChanges>[1],
            f.member(),
          ),
        ).toMatchObject({
          ok: false,
          code: OnboardingErrorCode.ValidationError,
        });
      });

      it("opens only the requested blocks for the customer and resets them on resubmission", async () => {
        const contact = await sessions.session(f.customerId);
        const target = await form();
        await review(target, 0, askCustomer());
        await review(target, 1, askInCall());

        // Before the team sends the request, the portal neither opens the block nor shows the note.
        expect(
          await getPortalOnboardingForm(contact, target.id, Locale.De),
        ).toMatchObject({
          editableBlockIds: [],
          blocks: [{ reviewNote: null }, { reviewNote: null }],
        });
        await requestChanges(target);

        expect(
          await getPortalOnboardingForm(contact, target.id, Locale.De),
        ).toMatchObject({
          status: OnboardingFormStatus.ChangesRequested,
          editableBlockIds: [blockId(target, 0)],
          blocks: [
            { reviewNote: "Welche Domain meint ihr?" },
            { reviewNote: null },
          ],
        });
        const save = (index: number, value: string) =>
          savePortalOnboardingAnswer(contact, target.id, {
            fieldId: target.blocks[index].block.fields[0].id,
            groupEntryId: null,
            values: [value],
          });
        expect(await save(0, "acme.example")).toMatchObject({ ok: true });
        expect(await save(1, "Mehr")).toEqual({
          ok: false,
          code: PortalOnboardingErrorCode.Locked,
        });

        expect(await submitPortalOnboarding(contact, target.id)).toMatchObject({
          ok: true,
        });
        expect(await steps(target.id)).toMatchObject([
          {
            review_status: S.Pending,
            clarification_mode: null,
            review_note: null,
            reviewed_by_member_id: null,
            reviewed_at: null,
          },
          {
            review_status: S.Clarification,
            clarification_mode: M.Call,
            review_note: "Zielgruppe besprechen",
          },
        ]);
        expect(
          await review(target, 0, { reviewStatus: S.Complete }),
        ).toMatchObject({ ok: true });
      });
    });

    it("counts the review for the project area", async () => {
      const target = await form();
      await review(target, 0, askCustomer());

      expect(
        (await getProjectOnboarding(target.projectId, f.member()))?.review,
      ).toEqual({
        total: 2,
        reviewed: 1,
        clarifications: 1,
        customerClarifications: 1,
        callClarifications: 0,
      });
      expect(
        (await getProjectOnboarding(await f.project(), f.member()))?.review,
      ).toBeNull();
    });

    it("hides the form from members without projects.write and outside their scope", async () => {
      const target = await form();
      const foreign = await form(
        OnboardingFormStatus.Submitted,
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
      await review(target, 0, askCustomer());
      await review(foreign, 0, askCustomer());

      for (const [candidate, actor] of [
        [foreign, customerBound],
        [target, projectBound],
        [target, reader],
      ] as const) {
        expect(
          await review(candidate, 1, { reviewStatus: S.Complete }, actor),
        ).toEqual(FORM_NOT_FOUND);
        expect(await requestChanges(candidate, actor)).toEqual(FORM_NOT_FOUND);
        expect((await f.readFormRow(candidate.id)).status).toBe(
          OnboardingFormStatus.Submitted,
        );
        expect((await steps(candidate.id))[1].review_status).toBe(S.Pending);
      }
      expect(
        await review(target, 1, { reviewStatus: S.Complete }, customerBound),
      ).toMatchObject({ ok: true });
    });
  },
);
