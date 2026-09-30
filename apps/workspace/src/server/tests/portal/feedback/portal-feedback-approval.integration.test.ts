import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { PortalFeedbackErrorCode as E } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import { approvePortalFeedback } from "@/server/portal/command-handler/approve-portal-feedback.command-handler";
import { savePortalFeedbackDraft } from "@/server/portal/command-handler/save-portal-feedback-draft.command-handler";
import { submitPortalFeedbackRound } from "@/server/portal/command-handler/submit-portal-feedback-round.command-handler";
import { getPortalProjectFeedback } from "@/server/portal/query-handler/get-portal-project-feedback.query-handler";
import { changeFeedbackRoundStatus } from "@/server/workspace/crm/command-handler/change-feedback-round-status.command-handler";
import { handOverFeedbackRound } from "@/server/workspace/crm/command-handler/hand-over-feedback-round.command-handler";
import { setFeedbackItemResult } from "@/server/workspace/crm/command-handler/set-feedback-item-result.command-handler";
import { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";

vi.mock("server-only", () => ({}));

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "portal feedback approval PostgreSQL integration",
  () => {
    const f = createFeedbackIntegrationFixture();

    /** Hands a round over, lets the customer submit one item and starts the work on it. */
    async function roundInProgress(projectId: string) {
      const handed = await handOverFeedbackRound(
        projectId,
        { areaOptions: [] },
        f.member(),
      );
      if (!handed.ok) throw new Error("Expected a handed-over round");
      const roundId = handed.round.id;
      const itemId = crypto.randomUUID();
      await savePortalFeedbackDraft(f.contact(), roundId, {
        version: 1,
        items: [{ id: itemId, areaLabel: null, kind: null, body: "Logo" }],
      });
      await submitPortalFeedbackRound(f.contact(), roundId, { version: 2 });
      await changeFeedbackRoundStatus(
        roundId,
        { version: 3, to: FeedbackRoundStatus.InProgress },
        f.member(),
      );
      await setFeedbackItemResult(
        itemId,
        {
          version: 1,
          result: FeedbackItemResult.NotImplemented,
          resultNote: "Kommt mit dem Relaunch",
        },
        f.member(),
      );
      return { roundId, itemId };
    }

    async function completedRound(projectId: string) {
      const round = await roundInProgress(projectId);
      const completed = await changeFeedbackRoundStatus(
        round.roundId,
        { version: 4, to: FeedbackRoundStatus.Completed },
        f.member(),
      );
      if (!completed.ok) throw new Error("Expected a completed round");
      return round;
    }

    const approve = (roundId: string, confirmFinal = true) =>
      approvePortalFeedback(f.contact(), roundId, { version: 5, confirmFinal });

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
    }, 60_000);

    it("shows results to the customer only once the round is completed", async () => {
      const projectId = await f.project();
      const { roundId } = await roundInProgress(projectId);
      const working = await getPortalProjectFeedback(f.contact(), projectId);
      expect(working?.activeRound?.items).toEqual([
        expect.objectContaining({ result: null, resultNote: null }),
      ]);

      await changeFeedbackRoundStatus(
        roundId,
        { version: 4, to: FeedbackRoundStatus.Completed },
        f.member(),
      );
      const done = await getPortalProjectFeedback(f.contact(), projectId);
      expect(done).toMatchObject({
        activeRound: null,
        history: [
          {
            id: roundId,
            status: FeedbackRoundStatus.Completed,
            items: [
              {
                result: FeedbackItemResult.NotImplemented,
                resultNote: "Kommt mit dem Relaunch",
              },
            ],
          },
        ],
      });
    });

    it("approves the latest completed round only with confirmation and moves the track", async () => {
      const projectId = await f.project();
      const first = await completedRound(projectId);
      const handedTwo = await handOverFeedbackRound(
        projectId,
        { areaOptions: [] },
        f.member(),
      );
      if (!handedTwo.ok) throw new Error("Expected round 2");
      expect(await approve(first.roundId)).toEqual({
        ok: false,
        code: E.Locked,
      });

      await savePortalFeedbackDraft(f.contact(), handedTwo.round.id, {
        version: 1,
        items: [
          {
            id: crypto.randomUUID(),
            areaLabel: null,
            kind: null,
            body: "Nur noch das Impressum",
          },
        ],
      });
      await submitPortalFeedbackRound(f.contact(), handedTwo.round.id, {
        version: 2,
      });
      await changeFeedbackRoundStatus(
        handedTwo.round.id,
        { version: 3, to: FeedbackRoundStatus.InProgress },
        f.member(),
      );
      const [secondItem] =
        (await getPortalProjectFeedback(f.contact(), projectId))?.activeRound
          ?.items ?? [];
      await setFeedbackItemResult(
        secondItem.id,
        { version: 1, result: FeedbackItemResult.Implemented },
        f.member(),
      );
      await changeFeedbackRoundStatus(
        handedTwo.round.id,
        { version: 4, to: FeedbackRoundStatus.Completed },
        f.member(),
      );

      expect(await approve(first.roundId)).toEqual({
        ok: false,
        code: E.NotLatest,
      });
      expect(await approve(handedTwo.round.id, false)).toEqual({
        ok: false,
        code: E.ConfirmationRequired,
      });

      const before = await f.readProject(projectId);
      expect(await approve(handedTwo.round.id)).toMatchObject({
        ok: true,
        value: {
          status: FeedbackRoundStatus.Approved,
          approvedAt: expect.any(String),
        },
      });
      const after = await f.readProject(projectId);
      expect(after.current_process_step).toBe("Launch");
      expect(after.phase).toBe(before.phase);
      // The project editor writes through `updateVersioned` with the version it read, so the bump
      // turns a save from an editor opened before the approval into a 409.
      expect(after.version).toBe(before.version + 1);

      expect(await approve(handedTwo.round.id)).toEqual({
        ok: false,
        code: E.Locked,
      });
      expect(
        await handOverFeedbackRound(projectId, { areaOptions: [] }, f.member()),
      ).toEqual({
        ok: false,
        code: FeedbackRoundErrorCode.ProjectAlreadyApproved,
      });
    });

    it("refuses the approval while the round is still being worked on", async () => {
      const projectId = await f.project();
      const { roundId } = await roundInProgress(projectId);
      expect(
        await approvePortalFeedback(f.contact(), roundId, {
          version: 4,
          confirmFinal: true,
        }),
      ).toEqual({ ok: false, code: E.Locked });
    });
  },
);
