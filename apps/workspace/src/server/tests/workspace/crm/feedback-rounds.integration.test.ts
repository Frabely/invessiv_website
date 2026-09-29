import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode as E } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import {
  activities,
  feedbackRounds,
  messages,
} from "@invessiv/db/record-configuration";
import { handOverFeedbackRound } from "@/server/workspace/crm/command-handler/hand-over-feedback-round.command-handler";
import { getFeedbackRound } from "@/server/workspace/crm/query-handler/get-feedback-round.query-handler";
import { listProjectFeedbackRounds } from "@/server/workspace/crm/query-handler/list-project-feedback-rounds.query-handler";
import { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";

vi.mock("server-only", () => ({}));

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "feedback round handover PostgreSQL integration",
  () => {
    const f = createFeedbackIntegrationFixture();
    const request = { areaOptions: ["Startseite", "Über uns"] };

    async function setRoundStatus(
      projectId: string,
      status: FeedbackRoundStatus,
    ) {
      await f
        .database()
        .update(feedbackRounds)
        .set({
          status,
          submitted_at: status === FeedbackRoundStatus.Open ? null : new Date(),
          completed_at:
            status === FeedbackRoundStatus.Completed ? new Date() : null,
          completed_by_member_id:
            status === FeedbackRoundStatus.Completed ? f.memberId : null,
          approved_at:
            status === FeedbackRoundStatus.Approved ? new Date() : null,
        })
        .where(eq(feedbackRounds.project_id, projectId));
    }

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
    }, 60_000);

    it("hands over round 1 with snapshots and leaves phase and step alone", async () => {
      const projectId = await f.project();
      const before = await f.readProject(projectId);
      const result = await handOverFeedbackRound(
        projectId,
        {
          ...request,
          previewUrl: "https://preview.example.com",
          handoverNote: "  Neue Startseite  ",
        },
        f.member(),
      );
      expect(result).toMatchObject({
        ok: true,
        round: {
          roundNumber: 1,
          status: FeedbackRoundStatus.Open,
          areaOptions: request.areaOptions,
          handoverNote: "Neue Startseite",
          items: [],
        },
      });
      const after = await f.readProject(projectId);
      expect(after.feedback_areas).toEqual(request.areaOptions);
      expect(after.phase).toBe(before.phase);
      expect(after.current_process_step).toBe(before.current_process_step);

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
      expect(activity.metadata).toMatchObject({ round_number: 1 });
      const notices = await f
        .database()
        .select()
        .from(messages)
        .where(eq(messages.customer_id, f.customerId));
      expect(notices.map((message) => message.body)).toContain(
        SystemMessageKey.FeedbackRoundHandedOver,
      );
    });

    it("creates exactly one round for two parallel handovers", async () => {
      const projectId = await f.project();
      const results = await Promise.all([
        handOverFeedbackRound(projectId, request, f.member()),
        handOverFeedbackRound(projectId, request, f.member()),
      ]);
      const created = results.find((result) => result.ok);
      const rejected = results.find((result) => !result.ok);
      expect(created?.ok && rejected).toMatchObject({
        code: E.RoundAlreadyActive,
        activeRound: { id: created?.ok ? created.round.id : "" },
      });
      const rounds = await f
        .database()
        .select()
        .from(feedbackRounds)
        .where(eq(feedbackRounds.project_id, projectId));
      expect(rounds).toHaveLength(1);
    });

    it.each([ProjectStatus.Planned, ProjectStatus.Paused])(
      "rejects a %s project",
      async (status) => {
        const projectId = await f.project({ status });
        expect(
          await handOverFeedbackRound(projectId, request, f.member()),
        ).toEqual({ ok: false, code: E.ProjectNotEligible });
      },
    );

    it("rejects a track without round steps and a project not at the step", async () => {
      expect(
        await handOverFeedbackRound(
          await f.project({ positions: null, includedFeedbackRounds: 2 }),
          request,
          f.member(),
        ),
      ).toEqual({ ok: false, code: E.RoundStepMissing });
      expect(
        await handOverFeedbackRound(
          await f.project({ currentProcessStep: "Design" }),
          request,
          f.member(),
        ),
      ).toEqual({ ok: false, code: E.ProjectNotAtFeedbackStep });
    });

    it("rejects a handover after the approval and beyond the quota", async () => {
      const approved = await f.project();
      await handOverFeedbackRound(approved, request, f.member());
      await setRoundStatus(approved, FeedbackRoundStatus.Approved);
      expect(
        await handOverFeedbackRound(approved, request, f.member()),
      ).toEqual({ ok: false, code: E.ProjectAlreadyApproved });

      const single = await f.project({ positions: [2] });
      await handOverFeedbackRound(single, request, f.member());
      await setRoundStatus(single, FeedbackRoundStatus.Completed);
      expect(await handOverFeedbackRound(single, request, f.member())).toEqual({
        ok: false,
        code: E.QuotaExhausted,
      });
    });

    it("hands over round 2 after a completed round 1", async () => {
      const projectId = await f.project();
      await handOverFeedbackRound(projectId, request, f.member());
      await setRoundStatus(projectId, FeedbackRoundStatus.Completed);
      expect(
        await handOverFeedbackRound(projectId, request, f.member()),
      ).toMatchObject({ ok: true, round: { roundNumber: 2 } });
    });

    it("rejects invalid input before touching the project", async () => {
      const projectId = await f.project();
      for (const body of [
        { areaOptions: [], previewUrl: "http://insecure.example.com" },
        { areaOptions: [], dueOn: "2000-01-01" },
        { areaOptions: ["A", "A"] },
        { areaOptions: Array.from({ length: 31 }, (_, i) => `Seite ${i}`) },
        { areaOptions: ["x".repeat(81)] },
      ])
        expect(
          await handOverFeedbackRound(projectId, body, f.member()),
        ).toMatchObject({ ok: false, code: E.ValidationError });
    });

    it("hides foreign projects and projects outside a bound role", async () => {
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
        await handOverFeedbackRound(foreign, request, customerBound),
      ).toEqual({ ok: false, code: E.ProjectNotFound });
      expect(
        await listProjectFeedbackRounds(foreign, customerBound),
      ).toBeNull();
      const own = await f.project();
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
      expect(await handOverFeedbackRound(own, request, bound)).toEqual({
        ok: false,
        code: E.ProjectNotFound,
      });
      expect(await listProjectFeedbackRounds(own, bound)).toBeNull();
      const created = await handOverFeedbackRound(own, request, f.member());
      expect(
        created.ok && (await getFeedbackRound(created.round.id, bound)),
      ).toBeNull();
    });

    it("lists quota, rounds and why no further handover is possible", async () => {
      const projectId = await f.project();
      const created = await handOverFeedbackRound(
        projectId,
        request,
        f.member(),
      );
      const listed = await listProjectFeedbackRounds(projectId, f.member());
      expect(listed).toMatchObject({
        quota: { included: 2, used: 1, remaining: 1, activeRoundNumber: 1 },
        rounds: [{ roundNumber: 1, itemCount: 0, unread: false }],
        feedbackAreas: request.areaOptions,
        nextRoundNumber: 2,
        canHandOver: false,
        handOverBlocker: E.RoundAlreadyActive,
      });
      const reader = await listProjectFeedbackRounds(
        await f.project(),
        f.member([Permission.ProjectsRead]),
      );
      expect(reader).toMatchObject({
        canHandOver: false,
        handOverBlocker: null,
      });
      expect(
        created.ok && (await getFeedbackRound(created.round.id, f.member())),
      ).toMatchObject({ roundNumber: 1, items: [] });
    });
  },
);
