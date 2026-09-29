import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import {
  activities,
  feedbackRoundItems,
  feedbackRounds,
  files,
  projects,
  tasks,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { FEEDBACK_ROUND_ACTIVITY_ENTITY } from "@/common/constants/crm/feedback-round-activity-metadata";
import { feedbackProjectStepService } from "@/server/shared/services/feedback/feedback-project-step-service";
import { feedbackRoundActivityService } from "@/server/shared/services/feedback/feedback-round-activity-service";
import { feedbackRoundItemService } from "@/server/shared/services/feedback/feedback-round-item-service";
import { feedbackRoundTaskService } from "@/server/shared/services/feedback/feedback-round-task-service";
import type { FeedbackRoundRef } from "@/server/shared/services/feedback/feedback-service-types";
import { createFileTestFixture } from "../../files/file-test-fixture";

vi.mock("server-only", () => ({}));

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "feedback round services PostgreSQL integration",
  () => {
    const f = createFileTestFixture();
    const customerActor = () =>
      ({ type: ActorType.Customer, userId: f.actor().userId }) as const;

    /** One project per test keeps the one-active-round index out of the way. */
    async function project(
      track: {
        processSteps: string[];
        currentProcessStep: string;
        positions: number[];
      } = {
        processSteps: [ProjectPhase.Onboarding],
        currentProcessStep: ProjectPhase.Onboarding,
        positions: [1],
      },
    ) {
      const id = crypto.randomUUID();
      await f
        .database()
        .insert(projects)
        .values({
          ...(await projectTemplate()),
          id,
          process_steps: track.processSteps,
          current_process_step: track.currentProcessStep,
          included_feedback_rounds: track.positions.length,
          feedback_round_positions: track.positions,
        });
      return id;
    }

    async function projectTemplate() {
      const [row] = await f
        .database()
        .select()
        .from(projects)
        .where(eq(projects.id, f.projectId));
      return row;
    }

    async function round(
      projectId: string,
      status: FeedbackRoundStatus = FeedbackRoundStatus.Open,
    ): Promise<FeedbackRoundRef> {
      const id = crypto.randomUUID();
      const submitted = status !== FeedbackRoundStatus.Open;
      await f
        .database()
        .insert(feedbackRounds)
        .values({
          id,
          project_id: projectId,
          customer_id: f.customerId,
          round_number: 1,
          status,
          area_options: [],
          handed_over_by_member_id: f.memberId,
          handed_over_at: new Date(),
          submitted_at: submitted ? new Date() : null,
          started_at:
            status === FeedbackRoundStatus.InProgress ? new Date() : null,
          version: 1,
        });
      return {
        id,
        project_id: projectId,
        customer_id: f.customerId,
        round_number: 1,
      };
    }

    async function roundTasks(roundId: string) {
      return f
        .database()
        .select()
        .from(tasks)
        .where(eq(tasks.feedback_round_id, roundId));
    }

    async function items(roundId: string) {
      return f
        .database()
        .select()
        .from(feedbackRoundItems)
        .where(eq(feedbackRoundItems.round_id, roundId))
        .orderBy(feedbackRoundItems.position);
    }

    async function attachFile(target: FeedbackRoundRef, itemId: string) {
      const id = crypto.randomUUID();
      await f
        .database()
        .insert(files)
        .values({
          id,
          customer_id: f.customerId,
          project_id: target.project_id,
          feedback_round_id: target.id,
          feedback_item_id: itemId,
          source: FileSource.Link,
          status: FileStatus.Ready,
          asset_kind: AssetKind.Link,
          display_name: "Screenshot",
          url: `https://example.com/${id}`,
          visible_to_customer: true,
          uploaded_by_side: UploadSide.Customer,
          uploaded_by_portal_membership_id: f.membershipId,
          version: 1,
        });
      return id;
    }

    const draft = (id: string, body: string) => ({
      id,
      areaLabel: null,
      kind: null,
      body,
    });

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
    }, 60_000);

    it("creates the collecting task once and reopens it on the next submission", async () => {
      const target = await round(
        await project(),
        FeedbackRoundStatus.Submitted,
      );
      await f
        .database()
        .transaction((tx) =>
          feedbackRoundTaskService.ensureOpenForSubmission(
            tx,
            target,
            customerActor(),
          ),
        );
      const [created] = await roundTasks(target.id);
      expect(created).toMatchObject({
        status: TaskStatus.Open,
        action_side: "internal",
        visible_to_customer: false,
        assignee_member_id: f.memberId,
      });
      expect(created.title).toContain("1");

      await f
        .database()
        .transaction((tx) =>
          feedbackRoundTaskService.cancelForReturn(tx, target, f.actor()),
        );
      expect((await roundTasks(target.id))[0].status).toBe(
        TaskStatus.Cancelled,
      );

      await f
        .database()
        .transaction((tx) =>
          feedbackRoundTaskService.ensureOpenForSubmission(
            tx,
            target,
            customerActor(),
          ),
        );
      const reopened = await roundTasks(target.id);
      expect(reopened).toHaveLength(1);
      expect(reopened[0]).toMatchObject({
        id: created.id,
        status: TaskStatus.Open,
      });
    });

    it("leaves a task finished by hand untouched when the round completes", async () => {
      const target = await round(
        await project(),
        FeedbackRoundStatus.InProgress,
      );
      await f
        .database()
        .transaction((tx) =>
          feedbackRoundTaskService.ensureOpenForSubmission(
            tx,
            target,
            customerActor(),
          ),
        );
      const [task] = await roundTasks(target.id);
      await f
        .database()
        .update(tasks)
        .set({
          status: TaskStatus.Done,
          completed_at: new Date(),
          completed_by_member_id: f.memberId,
          version: task.version + 1,
        })
        .where(eq(tasks.id, task.id));

      await f.database().transaction(async (tx) => {
        await feedbackRoundTaskService.markInProgress(tx, target, f.actor());
        await feedbackRoundTaskService.completeForRound(tx, target, f.actor());
      });

      expect((await roundTasks(target.id))[0]).toMatchObject({
        status: TaskStatus.Done,
        version: task.version + 1,
      });
    });

    it("moves the task along the round from open to done", async () => {
      const target = await round(
        await project(),
        FeedbackRoundStatus.Submitted,
      );
      await f.database().transaction(async (tx) => {
        await feedbackRoundTaskService.ensureOpenForSubmission(
          tx,
          target,
          customerActor(),
        );
        await feedbackRoundTaskService.markInProgress(tx, target, f.actor());
        await feedbackRoundTaskService.completeForRound(tx, target, f.actor());
      });
      expect((await roundTasks(target.id))[0]).toMatchObject({
        status: TaskStatus.Done,
        completed_by_member_id: f.memberId,
      });
    });

    it("skips the task without failing when no owner is active", async () => {
      const target = await round(
        await project(),
        FeedbackRoundStatus.Submitted,
      );
      await f
        .database()
        .update(workspaceMembers)
        .set({ active: false })
        .where(eq(workspaceMembers.id, f.memberId));
      try {
        await f
          .database()
          .transaction((tx) =>
            feedbackRoundTaskService.ensureOpenForSubmission(
              tx,
              target,
              customerActor(),
            ),
          );
      } finally {
        await f
          .database()
          .update(workspaceMembers)
          .set({ active: true })
          .where(eq(workspaceMembers.id, f.memberId));
      }
      expect(await roundTasks(target.id)).toHaveLength(0);
    });

    it("inserts, reorders and removes draft items and frees the files of removed ones", async () => {
      const target = await round(await project());
      const [first, second, third] = [
        crypto.randomUUID(),
        crypto.randomUUID(),
        crypto.randomUUID(),
      ];
      await f
        .database()
        .transaction((tx) =>
          feedbackRoundItemService.replaceDraftItems(
            tx,
            target,
            [draft(first, "Header"), draft(second, ""), draft(third, "Footer")],
            f.membershipId,
          ),
        );
      const fileId = await attachFile(target, second);

      await f
        .database()
        .transaction((tx) =>
          feedbackRoundItemService.replaceDraftItems(
            tx,
            target,
            [draft(third, "Footer"), draft(first, "Header, bigger")],
            f.membershipId,
          ),
        );

      expect(
        (await items(target.id)).map((item) => [
          item.id,
          item.position,
          item.body,
          item.version,
        ]),
      ).toEqual([
        [third, 0, "Footer", 2],
        [first, 1, "Header, bigger", 2],
      ]);
      const [file] = await f
        .database()
        .select()
        .from(files)
        .where(eq(files.id, fileId));
      expect(file).toMatchObject({
        feedback_round_id: null,
        feedback_item_id: null,
        status: FileStatus.Ready,
        version: 2,
      });
    });

    it("loads items with the attachments the caller may see", async () => {
      const target = await round(await project());
      const [first, second] = [crypto.randomUUID(), crypto.randomUUID()];
      await f
        .database()
        .transaction((tx) =>
          feedbackRoundItemService.replaceDraftItems(
            tx,
            target,
            [draft(first, "Menu"), draft(second, "Contact form")],
            f.membershipId,
          ),
        );
      const shown = await attachFile(target, first);
      const hidden = await attachFile(target, first);

      const loaded = await f
        .database()
        .transaction((tx) =>
          feedbackRoundItemService.loadByRound(
            tx,
            [target.id],
            sql`${files.id} <> ${hidden}`,
          ),
        );
      const list = loaded.get(target.id) ?? [];
      expect(list.map((entry) => entry.item.id)).toEqual([first, second]);
      expect(list[0].attachments).toEqual([
        {
          fileId: shown,
          displayName: "Screenshot",
          assetKind: AssetKind.Link,
          sizeBytes: 0,
        },
      ]);
      expect(list[1].attachments).toEqual([]);
    });

    it("moves the project behind the approved round and leaves a round at the end alone", async () => {
      const steps = [
        ProjectPhase.Onboarding,
        ProjectPhase.Design,
        ProjectPhase.Launch,
      ];
      const projectId = await project({
        processSteps: steps,
        currentProcessStep: ProjectPhase.Design,
        positions: [2, 3],
      });
      const readStep = async () =>
        (
          await f
            .database()
            .select({ step: projects.current_process_step })
            .from(projects)
            .where(eq(projects.id, projectId))
        )[0].step;

      await f
        .database()
        .transaction((tx) =>
          feedbackProjectStepService.advancePastFeedbackRound(tx, projectId, 1),
        );
      expect(await readStep()).toBe(ProjectPhase.Launch);

      await f
        .database()
        .transaction((tx) =>
          feedbackProjectStepService.advancePastFeedbackRound(tx, projectId, 2),
        );
      expect(await readStep()).toBe(ProjectPhase.Launch);
    });

    it("logs round activities with the round in metadata and no feedback text", async () => {
      const target = await round(await project());
      await f.database().transaction(async (tx) => {
        await feedbackRoundActivityService.recordHandedOver(
          tx,
          target,
          customerActor(),
        );
        await feedbackRoundActivityService.recordStatusChange(
          tx,
          target,
          customerActor(),
          {
            previous: FeedbackRoundStatus.Open,
            next: FeedbackRoundStatus.Approved,
          },
        );
      });
      const rows = await f
        .database()
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.project_id, target.project_id),
            sql`${activities.metadata} ->> 'feedback_round_id' = ${target.id}`,
          ),
        );
      expect(rows.map((row) => row.type).sort()).toEqual(
        [ActivityType.Created, ActivityType.FieldChange].sort(),
      );
      for (const row of rows) {
        expect(row.customer_id).toBe(f.customerId);
        expect(row.body).toBeNull();
        expect(row.metadata).toMatchObject({
          entity: FEEDBACK_ROUND_ACTIVITY_ENTITY,
          round_number: 1,
        });
      }
    });
  },
);
