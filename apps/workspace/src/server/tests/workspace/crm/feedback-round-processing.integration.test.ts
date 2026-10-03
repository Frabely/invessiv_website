import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode as E } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ChangeFeedbackRoundStatusRequestDto } from "@invessiv/common/contracts/crm/change-feedback-round-status-request.dto";
import { activities, messages, tasks } from "@invessiv/db/record-configuration";
import { savePortalFeedbackDraft } from "@/server/portal/command-handler/save-portal-feedback-draft.command-handler";
import { submitPortalFeedbackRound } from "@/server/portal/command-handler/submit-portal-feedback-round.command-handler";
import { changeFeedbackRoundStatus } from "@/server/workspace/crm/command-handler/change-feedback-round-status.command-handler";
import { handOverFeedbackRound } from "@/server/workspace/crm/command-handler/hand-over-feedback-round.command-handler";
import { setFeedbackItemResult } from "@/server/workspace/crm/command-handler/set-feedback-item-result.command-handler";
import { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";

vi.mock("server-only", () => ({}));

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "feedback round processing PostgreSQL integration",
  () => {
    const f = createFeedbackIntegrationFixture();

    /** Hands a round over and lets the customer submit `bodies` as items. */
    async function submittedRound(bodies = ["Logo größer", "Farbe dunkler"]) {
      const projectId = await f.project();
      const handed = await handOverFeedbackRound(
        projectId,
        { areaOptions: [] },
        f.member(),
      );
      if (!handed.ok) throw new Error("Expected a handed-over round");
      const roundId = handed.round.id;
      const itemIds = bodies.map(() => crypto.randomUUID());
      await savePortalFeedbackDraft(f.contact(), roundId, {
        version: 1,
        items: bodies.map((body, index) => ({
          id: itemIds[index],
          areaLabel: null,
          kind: null,
          body,
        })),
      });
      const submitted = await submitPortalFeedbackRound(f.contact(), roundId, {
        version: 2,
      });
      if (!submitted.ok) throw new Error("Expected a submitted round");
      return { projectId, roundId, itemIds, version: 3 };
    }

    async function change(
      roundId: string,
      input: ChangeFeedbackRoundStatusRequestDto,
      actor = f.member(),
    ) {
      return changeFeedbackRoundStatus(roundId, input, actor);
    }

    async function roundTask(roundId: string) {
      const [task] = await f
        .database()
        .select()
        .from(tasks)
        .where(eq(tasks.feedback_round_id, roundId));
      return task;
    }

    async function statusActivities(projectId: string) {
      return f
        .database()
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.project_id, projectId),
            eq(activities.type, ActivityType.FieldChange),
          ),
        );
    }

    async function implementAll(itemIds: readonly string[]) {
      for (const itemId of itemIds)
        await setFeedbackItemResult(
          itemId,
          { version: 1, result: FeedbackItemResult.Implemented },
          f.member(),
        );
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
    }, 60_000);

    it("walks from the call request to the completion with one activity per step", async () => {
      const { projectId, roundId, itemIds } = await submittedRound();
      const before = await f.readProject(projectId);

      const discussed = await change(roundId, {
        version: 3,
        to: FeedbackRoundStatus.InDiscussion,
        customerNotice: "  Passt dir Donnerstag?  ",
      });
      expect(discussed).toMatchObject({
        ok: true,
        round: {
          status: FeedbackRoundStatus.InDiscussion,
          customerNotice: "Passt dir Donnerstag?",
        },
      });

      const started = await change(roundId, {
        version: 4,
        to: FeedbackRoundStatus.InProgress,
      });
      expect(started).toMatchObject({
        ok: true,
        round: { status: FeedbackRoundStatus.InProgress, customerNotice: null },
      });
      expect(started.ok && started.round.startedAt).not.toBeNull();
      expect((await roundTask(roundId)).status).toBe(TaskStatus.InProgress);

      await setFeedbackItemResult(
        itemIds[0],
        { version: 1, result: FeedbackItemResult.Implemented },
        f.member(),
      );
      await setFeedbackItemResult(
        itemIds[1],
        {
          version: 1,
          result: FeedbackItemResult.AdditionalService,
          resultNote: "Gern als Zusatzleistung",
        },
        f.member(),
      );
      const completed = await change(roundId, {
        version: 5,
        to: FeedbackRoundStatus.Completed,
      });
      expect(completed).toMatchObject({
        ok: true,
        round: {
          status: FeedbackRoundStatus.Completed,
          completedByMemberId: f.member().workspaceMemberId,
          items: [
            { result: FeedbackItemResult.Implemented },
            {
              result: FeedbackItemResult.AdditionalService,
              resultNote: "Gern als Zusatzleistung",
            },
          ],
        },
      });
      const task = await roundTask(roundId);
      expect(task.status).toBe(TaskStatus.Done);
      expect(task.completed_by_member_id).toBe(f.member().workspaceMemberId);

      expect(
        (await statusActivities(projectId))
          .map((activity) => activity.metadata)
          .filter((metadata) => metadata?.feedback_round_id === roundId)
          .map((metadata) => metadata?.next)
          .sort(),
      ).toEqual([
        FeedbackRoundStatus.Completed,
        FeedbackRoundStatus.InDiscussion,
        FeedbackRoundStatus.InProgress,
      ]);
      const notices = await f
        .database()
        .select({ body: messages.body })
        .from(messages)
        .where(eq(messages.customer_id, f.customerId));
      expect(notices.map((notice) => notice.body)).toEqual(
        expect.arrayContaining([
          SystemMessageKey.FeedbackRoundDiscussionRequested,
          SystemMessageKey.FeedbackRoundCompleted,
        ]),
      );
      const after = await f.readProject(projectId);
      expect(after.phase).toBe(before.phase);
      expect(after.current_process_step).toBe(before.current_process_step);
    });

    it("advances after a round with an intervening step and allows the next handover", async () => {
      const projectId = await f.project({
        processSteps: [
          "Onboarding",
          "Design",
          "Development",
          "Launch",
          "Maintenance",
        ],
        currentProcessStep: "Design",
        positions: [2, 3, 3],
      });
      const handed = await handOverFeedbackRound(
        projectId,
        { areaOptions: [] },
        f.member(),
      );
      if (!handed.ok) throw new Error("Expected a handed-over round");
      const itemId = crypto.randomUUID();
      await savePortalFeedbackDraft(f.contact(), handed.round.id, {
        version: 1,
        items: [{ id: itemId, areaLabel: null, kind: null, body: "Check" }],
      });
      await submitPortalFeedbackRound(f.contact(), handed.round.id, {
        version: 2,
      });
      await change(handed.round.id, {
        version: 3,
        to: FeedbackRoundStatus.InProgress,
      });
      await implementAll([itemId]);
      expect(
        await change(handed.round.id, {
          version: 4,
          to: FeedbackRoundStatus.Completed,
        }),
      ).toMatchObject({ ok: true });
      expect((await f.readProject(projectId)).current_process_step).toBe(
        "Development",
      );
      expect(
        await handOverFeedbackRound(projectId, { areaOptions: [] }, f.member()),
      ).toMatchObject({
        ok: true,
        round: { roundNumber: 2 },
      });
    });

    it("refuses steps outside the transition table and an incomplete completion", async () => {
      const { roundId, itemIds } = await submittedRound();
      expect(
        await change(roundId, {
          version: 3,
          to: FeedbackRoundStatus.Completed,
        }),
      ).toEqual({ ok: false, code: E.InvalidTransition });
      await change(roundId, { version: 3, to: FeedbackRoundStatus.InProgress });
      await implementAll(itemIds.slice(1));
      expect(
        await change(roundId, {
          version: 4,
          to: FeedbackRoundStatus.Completed,
        }),
      ).toEqual({ ok: false, code: E.ResultsIncomplete });
      expect(
        await change(roundId, {
          version: 4,
          to: FeedbackRoundStatus.Open,
          customerNotice: "Zurück",
        }),
      ).toEqual({ ok: false, code: E.InvalidTransition });
    });

    it("answers a stale version with the current round", async () => {
      const { roundId } = await submittedRound();
      await change(roundId, { version: 3, to: FeedbackRoundStatus.InProgress });
      expect(
        await change(roundId, {
          version: 3,
          to: FeedbackRoundStatus.InDiscussion,
        }),
      ).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          currentVersion: 4,
          current: { status: FeedbackRoundStatus.InProgress },
        },
      });
    });

    it("hands a round back with a notice and reopens the same task on resubmission", async () => {
      const { roundId, itemIds } = await submittedRound();
      const taskId = (await roundTask(roundId)).id;
      expect(
        await change(roundId, { version: 3, to: FeedbackRoundStatus.Open }),
      ).toMatchObject({ ok: false, code: E.ValidationError });

      const returned = await change(roundId, {
        version: 3,
        to: FeedbackRoundStatus.Open,
        customerNotice: "Bitte noch die Texte für „Über uns“",
      });
      expect(returned).toMatchObject({
        ok: true,
        round: {
          status: FeedbackRoundStatus.Open,
          submittedAt: null,
          customerNotice: "Bitte noch die Texte für „Über uns“",
          items: itemIds.map((id) => ({ id })),
        },
      });
      expect((await roundTask(roundId)).status).toBe(TaskStatus.Cancelled);

      const resubmitted = await submitPortalFeedbackRound(
        f.contact(),
        roundId,
        { version: 4 },
      );
      expect(resubmitted).toMatchObject({
        ok: true,
        value: { round: { status: FeedbackRoundStatus.Submitted } },
      });
      const roundTasks = await f
        .database()
        .select()
        .from(tasks)
        .where(eq(tasks.feedback_round_id, roundId));
      expect(roundTasks).toEqual([
        expect.objectContaining({ id: taskId, status: TaskStatus.Open }),
      ]);
      expect((await f.readRound(roundId)).customer_notice).toBeNull();
    });

    it("leaves a task someone finished by hand untouched on completion", async () => {
      const { roundId, itemIds } = await submittedRound(["Nur ein Punkt"]);
      await change(roundId, { version: 3, to: FeedbackRoundStatus.InProgress });
      const task = await roundTask(roundId);
      const finishedAt = new Date("2026-09-01T10:00:00.000Z");
      await f
        .database()
        .update(tasks)
        .set({
          status: TaskStatus.Done,
          completed_at: finishedAt,
          completed_by_member_id: f.member().workspaceMemberId,
          version: task.version + 1,
        })
        .where(eq(tasks.id, task.id));
      await implementAll(itemIds);
      await change(roundId, { version: 4, to: FeedbackRoundStatus.Completed });
      const after = await roundTask(roundId);
      expect(after.version).toBe(task.version + 1);
      expect(after.completed_at).toEqual(finishedAt);
    });

    it("sets results only while the round is worked on and demands a reply", async () => {
      const { roundId, itemIds } = await submittedRound(["Punkt"]);
      expect(
        await setFeedbackItemResult(
          itemIds[0],
          { version: 1, result: FeedbackItemResult.NotImplemented },
          f.member(),
        ),
      ).toMatchObject({ ok: false, code: E.ValidationError });
      expect(
        await setFeedbackItemResult(
          itemIds[0],
          {
            version: 1,
            result: FeedbackItemResult.NotImplemented,
            resultNote: "Technisch nicht möglich",
          },
          f.member(),
        ),
      ).toMatchObject({
        ok: true,
        item: {
          result: FeedbackItemResult.NotImplemented,
          resultNote: "Technisch nicht möglich",
          resultSetByMemberId: f.member().workspaceMemberId,
          version: 2,
        },
      });
      expect(
        await setFeedbackItemResult(
          itemIds[0],
          { version: 1, result: FeedbackItemResult.Implemented },
          f.member(),
        ),
      ).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: { currentVersion: 2 },
      });

      await change(roundId, { version: 3, to: FeedbackRoundStatus.InProgress });
      await change(roundId, { version: 4, to: FeedbackRoundStatus.Completed });
      expect(
        await setFeedbackItemResult(
          itemIds[0],
          { version: 2, result: FeedbackItemResult.Implemented },
          f.member(),
        ),
      ).toEqual({ ok: false, code: E.RoundLocked });
    });

    it("refuses results on an open round", async () => {
      const projectId = await f.project();
      const handed = await handOverFeedbackRound(
        projectId,
        { areaOptions: [] },
        f.member(),
      );
      if (!handed.ok) throw new Error("Expected a handed-over round");
      const itemId = crypto.randomUUID();
      await savePortalFeedbackDraft(f.contact(), handed.round.id, {
        version: 1,
        items: [{ id: itemId, areaLabel: null, kind: null, body: "Entwurf" }],
      });
      expect(
        await setFeedbackItemResult(
          itemId,
          { version: 1, result: FeedbackItemResult.Implemented },
          f.member(),
        ),
      ).toEqual({ ok: false, code: E.RoundLocked });
    });

    it("lets exactly one of two parallel completions through", async () => {
      const { roundId, itemIds } = await submittedRound(["Punkt"]);
      await change(roundId, { version: 3, to: FeedbackRoundStatus.InProgress });
      await implementAll(itemIds);
      const results = await Promise.all([
        change(roundId, { version: 4, to: FeedbackRoundStatus.Completed }),
        change(roundId, { version: 4, to: FeedbackRoundStatus.Completed }),
      ]);
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      expect(results.find((result) => !result.ok)).toMatchObject({
        code: ConcurrencyErrorCode.VersionConflict,
      });
    });

    it("hides foreign rounds and rounds outside a bound role", async () => {
      const { roundId, itemIds } = await submittedRound(["Punkt"]);
      const reader = f.member([Permission.ProjectsRead]);
      const bound = f.actor({
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
      const foreign = f.actor({
        permissions: new Set(),
        customerPermissions: new Map([
          [
            f.foreignCustomerId,
            new Set([Permission.ProjectsRead, Permission.ProjectsWrite]),
          ],
        ]),
      });
      for (const actor of [reader, bound, foreign]) {
        expect(
          await change(
            roundId,
            { version: 3, to: FeedbackRoundStatus.InProgress },
            actor,
          ),
        ).toEqual({ ok: false, code: E.RoundNotFound });
        expect(
          await setFeedbackItemResult(
            itemIds[0],
            { version: 1, result: FeedbackItemResult.Implemented },
            actor,
          ),
        ).toEqual({ ok: false, code: E.ItemNotFound });
      }
      expect(
        await change(crypto.randomUUID(), {
          version: 1,
          to: FeedbackRoundStatus.InProgress,
        }),
      ).toEqual({ ok: false, code: E.RoundNotFound });
    });
  },
);
