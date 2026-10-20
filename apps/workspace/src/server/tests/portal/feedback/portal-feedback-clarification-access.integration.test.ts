import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode as E } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackRoundStatus as R } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalFeedbackErrorCode as P } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import { feedbackRoundItems } from "@invessiv/db/record-configuration";
import { createPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { answerPortalFeedbackClarification } from "@/server/portal/command-handler/answer-portal-feedback-clarification.command-handler";
import { FeedbackItemWriteConflictError } from "@/server/shared/services/feedback/feedback-item-write-conflict-error.class";
import { feedbackClarificationService } from "@/server/shared/services/feedback/feedback-clarification-service";
import { createPortalSessionFixture } from "@/server/tests/support/portal-session-fixture";
import { submittedFeedbackRound } from "@/server/tests/support/feedback/submitted-feedback-round";
import { askFeedbackItemClarification } from "@/server/workspace/crm/command-handler/ask-feedback-item-clarification.command-handler";
import { closeFeedbackItemClarification } from "@/server/workspace/crm/command-handler/close-feedback-item-clarification.command-handler";
import { changeFeedbackRoundStatus } from "@/server/workspace/crm/command-handler/change-feedback-round-status.command-handler";
import { setFeedbackItemResult } from "@/server/workspace/crm/command-handler/set-feedback-item-result.command-handler";
import { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";

vi.mock("server-only", () => ({}));
describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "feedback clarification access and replay boundaries",
  () => {
    const f = createFeedbackIntegrationFixture();
    const sessions = createPortalSessionFixture(
      () => f.database(),
      f.memberId,
      `integration:clarification-access:${crypto.randomUUID()}:`,
    );
    beforeAll(() => f.setup(), 60_000);
    afterAll(async () => {
      vi.restoreAllMocks();
      await f.cleanup();
      await sessions.cleanup();
    }, 60_000);

    it.each([R.Submitted, R.InDiscussion, R.InProgress])(
      "asks and answers while the round is %s",
      async (status) => {
        const {
          roundId,
          itemIds: [itemId],
        } = await submittedFeedbackRound(f, ["Point"]);
        if (status !== R.Submitted)
          expect(
            await changeFeedbackRoundStatus(
              roundId,
              { version: 3, to: status },
              f.member(),
            ),
          ).toMatchObject({ ok: true });
        const commandId = crypto.randomUUID();
        const asked = await askFeedbackItemClarification(
          itemId,
          { version: 1, commandId, question: "Which page?" },
          f.member(),
        );
        expect(asked).toMatchObject({ ok: true, item: { version: 2 } });
        const before = await f.readRound(roundId);
        const answered = await answerPortalFeedbackClarification(
          f.contact(),
          roundId,
          itemId,
          commandId,
          { version: 2, commandId: crypto.randomUUID(), answer: "Home" },
        );
        expect(answered).toMatchObject({
          ok: true,
          value: {
            version: 3,
            result: null,
            clarifications: [{ status: "answered" }],
          },
        });
        expect(await f.readRound(roundId)).toEqual(before);
      },
    );

    it("rechecks customer and project scopes for asks, closes and successful replays", async () => {
      const {
        itemIds: [itemId],
      } = await submittedFeedbackRound(f, ["Point"]);
      const commandId = crypto.randomUUID();
      const input = { version: 1, commandId, question: "Which page?" };
      await askFeedbackItemClarification(itemId, input, f.member());
      const outside = [
        f.actor({
          permissions: new Set(),
          customerPermissions: new Map([
            [f.foreignCustomerId, new Set([Permission.ProjectsWrite])],
          ]),
        }),
        f.actor({
          permissions: new Set(),
          projectPermissions: new Map([
            [
              f.siblingProjectId,
              {
                customerId: f.customerId,
                permissions: new Set([Permission.ProjectsWrite]),
              },
            ],
          ]),
        }),
      ];
      for (const actor of outside) {
        expect(
          await askFeedbackItemClarification(itemId, input, actor),
        ).toMatchObject({ ok: false, code: E.ItemNotFound });
        expect(
          await closeFeedbackItemClarification(
            itemId,
            commandId,
            { version: 2, commandId: crypto.randomUUID(), note: "Phone call" },
            actor,
          ),
        ).toMatchObject({ ok: false, code: E.ItemNotFound });
      }
    });

    it("rejects an owner view and a real foreign customer session", async () => {
      const {
        roundId,
        itemIds: [itemId],
      } = await submittedFeedbackRound(f, ["Point"]);
      const questionId = crypto.randomUUID();
      await askFeedbackItemClarification(
        itemId,
        { version: 1, commandId: questionId, question: "Which page?" },
        f.member(),
      );
      const input = {
        version: 2,
        commandId: crypto.randomUUID(),
        answer: "Home",
      };
      const foreign = await sessions.session(f.foreignCustomerId);
      expect(
        await answerPortalFeedbackClarification(
          foreign,
          roundId,
          itemId,
          questionId,
          input,
        ),
      ).toMatchObject({ ok: false, code: P.NotFound });
      const owner = createPortalOwnerView({
        userId: f.member().userId,
        customerId: f.customerId,
        permissions: new Set([
          Permission.PortalFeedbackRead,
          Permission.PortalFeedbackSubmit,
        ]),
      });
      // Deliberately bypass the compile-time actor boundary to prove the runtime owner exclusion.
      expect(
        await answerPortalFeedbackClarification(
          // @ts-expect-error Owner views must never be accepted as portal actors.
          owner,
          roundId,
          itemId,
          questionId,
          input,
        ),
      ).toMatchObject({ ok: false, code: P.NotFound });
    });

    it("retains the current public item on stale answers and binds answer replays to their original contact", async () => {
      const {
        roundId,
        itemIds: [itemId],
      } = await submittedFeedbackRound(f, ["Point"]);
      const questionId = crypto.randomUUID();
      await askFeedbackItemClarification(
        itemId,
        { version: 1, commandId: questionId, question: "Which page?" },
        f.member(),
      );
      const contactA = await sessions.session(f.customerId),
        contactB = await sessions.session(f.customerId);
      const input = {
        version: 1,
        commandId: crypto.randomUUID(),
        answer: "Home",
      };
      const stale = await answerPortalFeedbackClarification(
        contactA,
        roundId,
        itemId,
        questionId,
        input,
      );
      expect(stale).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          currentVersion: 2,
          current: {
            result: null,
            resultNote: null,
            version: 2,
            clarifications: [{ id: questionId, status: "open" }],
          },
        },
      });
      if (stale.ok || !("conflict" in stale))
        throw new Error("Expected a point conflict");
      expect(stale.conflict.current).not.toHaveProperty("resultHistory");
      const next = { ...input, commandId: crypto.randomUUID(), version: 2 };
      expect(
        await answerPortalFeedbackClarification(
          contactA,
          roundId,
          itemId,
          questionId,
          next,
        ),
      ).toMatchObject({ ok: true });
      expect(
        await answerPortalFeedbackClarification(
          contactB,
          roundId,
          itemId,
          questionId,
          next,
        ),
      ).toMatchObject({ ok: false, code: P.CommandIdReused });
      await setFeedbackItemResult(
        itemId,
        { version: 3, result: "implemented" },
        f.member(),
      );
      await changeFeedbackRoundStatus(
        roundId,
        { version: 3, to: R.InProgress },
        f.member(),
      );
      await changeFeedbackRoundStatus(
        roundId,
        { version: 4, to: R.Completed },
        f.member(),
      );
      expect(
        await answerPortalFeedbackClarification(
          contactA,
          roundId,
          itemId,
          questionId,
          next,
        ),
      ).toMatchObject({
        ok: true,
        value: { version: 4, result: "implemented" },
      });
      expect(
        await answerPortalFeedbackClarification(
          contactA,
          roundId,
          itemId,
          questionId,
          { ...next, commandId: crypto.randomUUID() },
        ),
      ).toMatchObject({ ok: false, code: P.Locked });
    });

    it("rolls back a new question before returning the current item after a lost versioned write", async () => {
      const {
        itemIds: [itemId],
      } = await submittedFeedbackRound(f, ["Point"]);
      const failure = vi
        .spyOn(feedbackClarificationService, "writeItem")
        .mockRejectedValueOnce(new FeedbackItemWriteConflictError());
      const result = await askFeedbackItemClarification(
        itemId,
        { version: 1, commandId: crypto.randomUUID(), question: "Which page?" },
        f.member(),
      );
      failure.mockRestore();
      expect(result).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          currentVersion: 1,
          current: { version: 1, clarifications: [], resultHistory: [] },
        },
      });
      const [item] = await f
        .database()
        .select()
        .from(feedbackRoundItems)
        .where(eq(feedbackRoundItems.id, itemId));
      expect(item.version).toBe(1);
    });
  },
);
