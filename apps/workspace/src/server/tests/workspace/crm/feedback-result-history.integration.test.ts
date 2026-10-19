import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { FeedbackRoundErrorCode as E } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackResultActorSide } from "@invessiv/common/constants/crm/feedback-result-actor-sides";
import { FeedbackResultHistoryEventKind as K } from "@invessiv/common/constants/crm/feedback-result-history-event-kinds";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ChangeFeedbackRoundStatusRequestDto } from "@invessiv/common/contracts/crm/change-feedback-round-status-request.dto";
import {
  feedbackRoundItems,
  feedbackRoundItemResultHistory,
} from "@invessiv/db/record-configuration";
import { savePortalFeedbackDraft } from "@/server/portal/command-handler/save-portal-feedback-draft.command-handler";
import { feedbackResultHistoryService } from "@/server/shared/services/feedback/feedback-result-history-service";
import { changeFeedbackRoundStatus } from "@/server/workspace/crm/command-handler/change-feedback-round-status.command-handler";
import { setFeedbackItemResult } from "@/server/workspace/crm/command-handler/set-feedback-item-result.command-handler";
import { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";
import { submittedFeedbackRound } from "../../support/feedback/submitted-feedback-round";

vi.mock("server-only", () => ({}));

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "feedback result history PostgreSQL integration",
  () => {
    const f = createFeedbackIntegrationFixture();
    const submittedRound = (bodies?: string[]) =>
      submittedFeedbackRound(f, bodies);
    const change = (
      roundId: string,
      input: ChangeFeedbackRoundStatusRequestDto,
    ) => changeFeedbackRoundStatus(roundId, input, f.member());
    beforeAll(() => f.setup(), 60_000);
    afterAll(() => f.cleanup(), 60_000);
    it.each(Object.values(FeedbackItemResult))(
      "resets %s with one legacy baseline and keeps the old explanation",
      async (result) => {
        const { itemIds, roundId } = await submittedRound(["Point"]);
        const itemId = itemIds[0];
        const originalAt = new Date("2026-09-01T10:00:00.000Z");
        // Simulate an already rated row from before history was introduced.
        await f
          .database()
          .update(feedbackRoundItems)
          .set({
            result,
            result_note: "Original explanation",
            result_set_by_member_id: f.member().workspaceMemberId,
            result_set_at: originalAt,
          })
          .where(eq(feedbackRoundItems.id, itemId));
        const reset = await setFeedbackItemResult(
          itemId,
          { version: 1, result: null, commandId: crypto.randomUUID() },
          f.member(),
        );
        expect(reset).toMatchObject({
          ok: true,
          item: {
            version: 2,
            result: null,
            resultNote: null,
            resultSetAt: null,
            resultSetByMemberId: null,
            resultHistory: [
              {
                kind: K.Baseline,
                itemVersion: 1,
                result,
                resultNote: "Original explanation",
                occurredAt: originalAt.toISOString(),
              },
              { kind: K.Reset, itemVersion: 2, result: null, resultNote: null },
            ],
          },
        });
        const saved = await setFeedbackItemResult(
          itemId,
          { version: 2, result, resultNote: "New explanation" },
          f.member(),
        );
        expect(
          saved.ok && saved.item.resultHistory.map((entry) => entry.kind),
        ).toEqual([K.Baseline, K.Reset, K.Set]);
        await setFeedbackItemResult(
          itemId,
          { version: 3, result: null },
          f.member(),
        );
        await change(roundId, {
          version: 3,
          to: FeedbackRoundStatus.InProgress,
        });
        expect(
          await change(roundId, {
            version: 4,
            to: FeedbackRoundStatus.Completed,
          }),
        ).toMatchObject({ ok: false, code: E.ResultsIncomplete });
      },
    );

    it("keeps no-ops unchanged, replays the current item, and rejects a reused command payload", async () => {
      const { itemIds } = await submittedRound(["Point"]);
      const itemId = itemIds[0];
      expect(
        await setFeedbackItemResult(
          itemId,
          { version: 1, result: null },
          f.member(),
        ),
      ).toMatchObject({ ok: true, item: { version: 1, resultHistory: [] } });
      const request = {
        version: 1,
        result: FeedbackItemResult.Implemented,
        resultNote: "  Done  ",
        commandId: crypto.randomUUID(),
      };
      const first = await setFeedbackItemResult(itemId, request, f.member());
      expect(first).toMatchObject({
        ok: true,
        item: { version: 2, resultHistory: [{ kind: K.Set }] },
      });
      const noop = await setFeedbackItemResult(
        itemId,
        {
          ...request,
          version: 2,
          commandId: crypto.randomUUID(),
          resultNote: "Done",
        },
        f.member(),
      );
      expect(noop).toEqual(first);
      const reset = await setFeedbackItemResult(
        itemId,
        { version: 2, result: null, commandId: crypto.randomUUID() },
        f.member(),
      );
      expect(await setFeedbackItemResult(itemId, request, f.member())).toEqual(
        reset,
      );
      for (const changed of [
        { resultNote: "Different" },
        { version: 2 },
        { result: null, resultNote: null },
      ]) {
        expect(
          await setFeedbackItemResult(
            itemId,
            { ...request, ...changed },
            f.member(),
          ),
        ).toEqual({ ok: false, code: E.CommandIdReused });
      }
      const conflict = await setFeedbackItemResult(
        itemId,
        {
          version: 1,
          result: FeedbackItemResult.Implemented,
          commandId: crypto.randomUUID(),
        },
        f.member(),
      );
      expect(conflict).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          currentVersion: 3,
          current: { resultHistory: [{ kind: K.Set }, { kind: K.Reset }] },
        },
      });
      expect(
        await setFeedbackItemResult(
          itemId,
          {
            version: 3,
            result: FeedbackItemResult.Implemented,
            commandId: crypto.randomUUID(),
          },
          f.member(),
        ),
      ).toMatchObject({ ok: true, item: { version: 4 } });
    });

    it("records a legacy request without command id under a generated id and keeps its conflict semantics", async () => {
      const { itemIds } = await submittedRound(["Point"]);
      const itemId = itemIds[0];
      const legacy = {
        version: 1,
        result: FeedbackItemResult.NotImplemented,
        resultNote: "Out of scope",
      };
      expect(
        await setFeedbackItemResult(itemId, legacy, f.member()),
      ).toMatchObject({
        ok: true,
        item: { version: 2, resultHistory: [{ kind: K.Set, itemVersion: 2 }] },
      });
      const [entry] = await f
        .database()
        .select()
        .from(feedbackRoundItemResultHistory)
        .where(eq(feedbackRoundItemResultHistory.item_id, itemId));
      expect(entry.command_id).toMatch(/^[0-9a-f-]{36}$/);
      expect(entry.request_version).toBe(1);
      expect(
        await setFeedbackItemResult(itemId, legacy, f.member()),
      ).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: { currentVersion: 2 },
      });
    });

    it("serializes concurrent retries into a single history event and allows replay after completion", async () => {
      const { itemIds, roundId } = await submittedRound(["Point"]);
      const request = {
        version: 1,
        result: FeedbackItemResult.Implemented,
        commandId: crypto.randomUUID(),
      };
      const results = await Promise.all([
        setFeedbackItemResult(itemIds[0], request, f.member()),
        setFeedbackItemResult(itemIds[0], request, f.member()),
      ]);
      expect(results[0]).toEqual(results[1]);
      expect(results[0]).toMatchObject({
        ok: true,
        item: { version: 2, resultHistory: [{ kind: K.Set }] },
      });
      await change(roundId, { version: 3, to: FeedbackRoundStatus.InProgress });
      await change(roundId, { version: 4, to: FeedbackRoundStatus.Completed });
      expect(
        await setFeedbackItemResult(itemIds[0], request, f.member()),
      ).toEqual(results[0]);
      expect(
        await setFeedbackItemResult(
          itemIds[0],
          { version: 2, result: null },
          f.member(),
        ),
      ).toEqual({ ok: false, code: E.RoundLocked });
    });

    it("rolls the item and history back when an error follows the history insert", async () => {
      const { itemIds } = await submittedRound(["Point"]);
      const record = feedbackResultHistoryService.recordChange;
      const spy = vi
        .spyOn(feedbackResultHistoryService, "recordChange")
        .mockImplementationOnce(async (...args) => {
          await record(...args);
          throw new Error("Injected failure after history insert");
        });
      try {
        await expect(
          setFeedbackItemResult(
            itemIds[0],
            { version: 1, result: FeedbackItemResult.Implemented },
            f.member(),
          ),
        ).rejects.toThrow("Injected failure");
      } finally {
        spy.mockRestore();
      }
      expect(
        await f
          .database()
          .select()
          .from(feedbackRoundItemResultHistory)
          .where(eq(feedbackRoundItemResultHistory.item_id, itemIds[0])),
      ).toEqual([]);
      const [stored] = await f
        .database()
        .select()
        .from(feedbackRoundItems)
        .where(eq(feedbackRoundItems.id, itemIds[0]));
      expect(stored).toMatchObject({ version: 1, result: null });
    });

    it("records the legacy portal draft reset internally and cascades history when that draft item is removed", async () => {
      const { itemIds, roundId } = await submittedRound(["Point"]);
      await f
        .database()
        .update(feedbackRoundItems)
        .set({
          result: FeedbackItemResult.Implemented,
          result_set_at: new Date("2026-09-01T10:00:00.000Z"),
          result_set_by_member_id: f.member().workspaceMemberId,
        })
        .where(eq(feedbackRoundItems.id, itemIds[0]));
      await f.returnRoundAsLegacy(roundId, "Please clarify");
      const saved = await savePortalFeedbackDraft(f.contact(), roundId, {
        version: 4,
        items: [
          {
            id: itemIds[0],
            areaLabel: null,
            kind: null,
            body: "Changed point",
          },
        ],
      });
      expect(saved.ok).toBe(true);
      expect(JSON.stringify(saved)).not.toContain("resultHistory");
      const history = await feedbackResultHistoryService.loadByItems(
        f.database(),
        itemIds,
      );
      expect(history.get(itemIds[0])).toMatchObject([
        { kind: K.Baseline, occurredAt: "2026-09-01T10:00:00.000Z" },
        { kind: K.Reset, actorSide: FeedbackResultActorSide.PortalContact },
      ]);
      const stale = await savePortalFeedbackDraft(f.contact(), roundId, {
        version: 4,
        items: [],
      });
      expect(stale.ok).toBe(false);
      expect(JSON.stringify(stale)).not.toContain("resultHistory");
      await savePortalFeedbackDraft(f.contact(), roundId, {
        version: 5,
        items: [],
      });
      expect(
        (await feedbackResultHistoryService.loadByItems(f.database(), itemIds))
          .size,
      ).toBe(0);
    });
  },
);
