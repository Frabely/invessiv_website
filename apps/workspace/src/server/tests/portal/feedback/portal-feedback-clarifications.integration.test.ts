import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode as E } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackRoundStatus as R } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalFeedbackErrorCode as P } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import {
  feedbackRoundItems,
  feedbackRoundItemClarifications,
  feedbackRoundItemResultHistory,
  messages,
  projects,
  tasks,
} from "@invessiv/db/record-configuration";
import { answerPortalFeedbackClarification } from "@/server/portal/command-handler/answer-portal-feedback-clarification.command-handler";
import { getPortalProjectFeedback } from "@/server/portal/query-handler/get-portal-project-feedback.query-handler";
import { feedbackClarificationService } from "@/server/shared/services/feedback/feedback-clarification-service";
import { feedbackResultHistoryService } from "@/server/shared/services/feedback/feedback-result-history-service";
import { messageService } from "@/server/shared/services/message/message-service";
import { createPortalSessionFixture } from "@/server/tests/support/portal-session-fixture";
import { submittedFeedbackRound } from "@/server/tests/support/feedback/submitted-feedback-round";
import { askFeedbackItemClarification } from "@/server/workspace/crm/command-handler/ask-feedback-item-clarification.command-handler";
import { closeFeedbackItemClarification } from "@/server/workspace/crm/command-handler/close-feedback-item-clarification.command-handler";
import { setFeedbackItemResult } from "@/server/workspace/crm/command-handler/set-feedback-item-result.command-handler";
import { changeFeedbackRoundStatus } from "@/server/workspace/crm/command-handler/change-feedback-round-status.command-handler";
import { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";

vi.mock("server-only", () => ({}));

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "feedback clarifications with real PostgreSQL sessions and locks",
  () => {
    const f = createFeedbackIntegrationFixture();
    const sessions = createPortalSessionFixture(
      () => f.database(),
      f.memberId,
      `integration:clarifications:${crypto.randomUUID()}:`,
    );
    const setup = () => submittedFeedbackRound(f, ["Point one", "Point two"]);
    const ask = (
      id: string,
      version = 1,
      question = " Which page? ",
      commandId = crypto.randomUUID(),
    ) =>
      askFeedbackItemClarification(
        id,
        { version, question, commandId },
        f.member(),
      );
    const close = (
      id: string,
      clarificationId: string,
      version: number,
      commandId = crypto.randomUUID(),
    ) =>
      closeFeedbackItemClarification(
        id,
        clarificationId,
        { version, note: " Clarified by phone ", commandId },
        f.member(),
      );
    const answer = (
      roundId: string,
      itemId: string,
      clarificationId: string,
      version: number,
      commandId = crypto.randomUUID(),
    ) =>
      answerPortalFeedbackClarification(
        f.contact(),
        roundId,
        itemId,
        clarificationId,
        { version, answer: " Home page ", commandId },
      );
    async function readItem(id: string) {
      const [row] = await f
        .database()
        .select()
        .from(feedbackRoundItems)
        .where(eq(feedbackRoundItems.id, id));
      return row;
    }
    async function chatCount(key: SystemMessageKey) {
      return (
        await f
          .database()
          .select({ id: messages.id })
          .from(messages)
          .where(
            and(eq(messages.customer_id, f.customerId), eq(messages.body, key)),
          )
      ).length;
    }
    beforeAll(() => f.setup(), 60_000);
    afterAll(async () => {
      vi.restoreAllMocks();
      await f.cleanup();
      await sessions.cleanup();
    }, 60_000);

    it.each(Object.values(FeedbackItemResult))(
      "atomically resets %s with a baseline, blocks all result writes and completion",
      async (result) => {
        const {
          roundId,
          itemIds: [id],
        } = await setup();
        await f
          .database()
          .update(feedbackRoundItems)
          .set({
            result,
            result_note: "Original note",
            result_set_by_member_id: f.memberId,
            result_set_at: new Date(),
          })
          .where(eq(feedbackRoundItems.id, id));
        const commandId = crypto.randomUUID();
        const asked = await ask(id, 1, "Which page?", commandId);
        expect(asked).toMatchObject({
          ok: true,
          item: {
            version: 2,
            result: null,
            resultNote: null,
            resultSetByMemberId: null,
            resultSetAt: null,
            resultHistory: [
              { kind: "baseline", result },
              { kind: "reset", result: null },
            ],
            clarifications: [
              { id: commandId, status: "open", question: "Which page?" },
            ],
          },
        });
        const history = await f
          .database()
          .select()
          .from(feedbackRoundItemResultHistory)
          .where(eq(feedbackRoundItemResultHistory.command_id, commandId));
        expect(history).toHaveLength(1);
        expect(history[0].item_version).toBe(2);
        for (const result of [null, ...Object.values(FeedbackItemResult)]) {
          expect(
            await setFeedbackItemResult(
              id,
              {
                version: 2,
                commandId: crypto.randomUUID(),
                result,
                resultNote: result === null ? null : "Reply",
              },
              f.member(),
            ),
          ).toMatchObject({
            ok: false,
            code: E.ClarificationOpen,
            item: { version: 2, clarifications: [{ status: "open" }] },
          });
        }
        expect(await ask(id, 2)).toMatchObject({
          ok: false,
          code: E.ClarificationOpen,
        });
        await changeFeedbackRoundStatus(
          roundId,
          { version: 3, to: R.InProgress },
          f.member(),
        );
        expect(
          await changeFeedbackRoundStatus(
            roundId,
            { version: 4, to: R.Completed },
            f.member(),
          ),
        ).toMatchObject({ ok: false, code: E.ClarificationsOpen });
        expect(await close(id, commandId, 2)).toMatchObject({
          ok: true,
          item: {
            version: 3,
            result: null,
            clarifications: [
              { status: "closed", closeNote: "Clarified by phone" },
            ],
          },
        });
        expect(
          await changeFeedbackRoundStatus(
            roundId,
            { version: 4, to: R.Completed },
            f.member(),
          ),
        ).toMatchObject({ ok: false, code: E.ResultsIncomplete });
      },
    );

    it("answers with any authorized customer contact without changing the round, task or unread stamps", async () => {
      const {
        roundId,
        projectId,
        itemIds: [id],
      } = await setup();
      const commandId = crypto.randomUUID();
      await ask(id, 1, "Which page?", commandId);
      const contact = await sessions.session(f.customerId, "Answering contact");
      const roundBefore = await f.readRound(roundId);
      const taskBefore = await f
        .database()
        .select()
        .from(tasks)
        .where(eq(tasks.feedback_round_id, roundId));
      const answered = await answerPortalFeedbackClarification(
        contact,
        roundId,
        id,
        commandId,
        { commandId: crypto.randomUUID(), version: 2, answer: " Home page " },
      );
      expect(answered).toMatchObject({
        ok: true,
        value: {
          version: 3,
          result: null,
          resultNote: null,
          clarifications: [
            {
              id: commandId,
              status: "answered",
              question: "Which page?",
              answer: "Home page",
            },
          ],
        },
      });
      if (!answered.ok) throw new Error("Expected successful answer");
      expect(Object.keys(answered.value.clarifications[0]).sort()).toEqual(
        [
          "id",
          "status",
          "question",
          "requestedAt",
          "answer",
          "answeredAt",
          "closeNote",
          "closedAt",
        ].sort(),
      );
      expect(answered.value).not.toHaveProperty("resultHistory");
      expect(await f.readRound(roundId)).toEqual(roundBefore);
      expect(
        await f
          .database()
          .select()
          .from(tasks)
          .where(eq(tasks.feedback_round_id, roundId)),
      ).toEqual(taskBefore);
      const page = await getPortalProjectFeedback(contact, projectId);
      expect(page).toMatchObject({
        activeRound: {
          items: [
            { result: null, clarifications: [{ status: "answered" }] },
            { clarifications: [] },
          ],
        },
      });
      const [stored] = await f
        .database()
        .select()
        .from(feedbackRoundItemClarifications)
        .where(eq(feedbackRoundItemClarifications.id, commandId));
      expect(stored.version).toBe(2);
      expect(stored.answered_by_portal_membership_id).toBe(
        contact.membershipId,
      );
    });

    it("replays old questions and answers after newer questions and results without extra writes or chat", async () => {
      const {
        roundId,
        itemIds: [id],
      } = await setup();
      const questionId = crypto.randomUUID(),
        answerId = crypto.randomUUID();
      const before = await chatCount(
        SystemMessageKey.FeedbackClarificationRequested,
      );
      await ask(id, 1, "Which page?", questionId);
      await answer(roundId, id, questionId, 2, answerId);
      const secondId = crypto.randomUUID();
      await ask(id, 3, "Which browser?", secondId);
      const closeId = crypto.randomUUID();
      await close(id, secondId, 4, closeId);
      await setFeedbackItemResult(
        id,
        { version: 5, result: FeedbackItemResult.Implemented },
        f.member(),
      );
      expect(await ask(id, 1, "Which page?", questionId)).toMatchObject({
        ok: true,
        item: {
          version: 6,
          result: FeedbackItemResult.Implemented,
          clarifications: [{ status: "answered" }, { status: "closed" }],
        },
      });
      expect(await answer(roundId, id, questionId, 2, answerId)).toMatchObject({
        ok: true,
        value: { version: 6, result: null },
      });
      expect(await close(id, secondId, 4, closeId)).toMatchObject({
        ok: true,
        item: { version: 6 },
      });
      expect(await ask(id, 1, "Changed text", questionId)).toMatchObject({
        ok: false,
        code: E.CommandIdReused,
      });
      expect(
        await answerPortalFeedbackClarification(
          f.contact(),
          roundId,
          id,
          questionId,
          { commandId: answerId, version: 2, answer: "Changed answer" },
        ),
      ).toMatchObject({ ok: false, code: P.CommandIdReused });
      for (const commandId of [questionId, answerId, closeId]) {
        expect(
          await setFeedbackItemResult(
            id,
            { version: 6, commandId, result: null },
            f.member(),
          ),
        ).toMatchObject({ ok: false, code: E.CommandIdReused });
        expect(await ask(id, 6, "Different action", commandId)).toMatchObject({
          ok: false,
          code: E.CommandIdReused,
        });
      }
      expect(
        await chatCount(SystemMessageKey.FeedbackClarificationRequested),
      ).toBe(before + 2);
      expect((await readItem(id)).version).toBe(6);
    });

    it("checks command identifiers across result, question, answer and close actions", async () => {
      const {
        roundId,
        itemIds: [id, other],
      } = await setup();
      const resultId = crypto.randomUUID();
      await setFeedbackItemResult(
        id,
        {
          version: 1,
          commandId: resultId,
          result: FeedbackItemResult.Implemented,
        },
        f.member(),
      );
      expect(await ask(id, 2, "Question", resultId)).toMatchObject({
        ok: false,
        code: E.CommandIdReused,
      });
      const questionId = crypto.randomUUID();
      await ask(id, 2, "Question", questionId);
      expect(await ask(other, 1, "Question", questionId)).toMatchObject({
        ok: false,
        code: E.CommandIdReused,
      });
      expect(await answer(roundId, id, questionId, 3, resultId)).toMatchObject({
        ok: false,
        code: P.CommandIdReused,
      });
      expect(await close(id, questionId, 3, resultId)).toMatchObject({
        ok: false,
        code: E.CommandIdReused,
      });
      const closeId = crypto.randomUUID();
      await close(id, questionId, 3, closeId);
      expect(
        await closeFeedbackItemClarification(
          id,
          questionId,
          { version: 3, commandId: closeId, note: "Other reason" },
          f.member(),
        ),
      ).toMatchObject({ ok: false, code: E.CommandIdReused });
      expect(await answer(roundId, id, questionId, 4)).toMatchObject({
        ok: false,
        code: P.ClarificationNotOpen,
        current: { version: 4 },
      });
      expect(await close(id, questionId, 4)).toMatchObject({
        ok: false,
        code: E.ClarificationNotOpen,
        item: { version: 4 },
      });
    });

    it("serializes two new questions, two customer answers and answer versus internal close", async () => {
      const {
        roundId,
        itemIds: [id],
      } = await setup();
      const requested = await Promise.all([ask(id), ask(id)]);
      expect(requested.filter((result) => result.ok)).toHaveLength(1);
      const question = requested.find((result) => result.ok);
      if (!question?.ok) throw new Error("Expected a question");
      const questionId = question.item.clarifications[0].id;
      const contacts = await Promise.all([
        sessions.session(f.customerId),
        sessions.session(f.customerId),
      ]);
      const answered = await Promise.all(
        contacts.map((contact) =>
          answerPortalFeedbackClarification(contact, roundId, id, questionId, {
            version: 2,
            commandId: crypto.randomUUID(),
            answer: "Home",
          }),
        ),
      );
      expect(answered.filter((result) => result.ok)).toHaveLength(1);
      expect(answered.find((result) => !result.ok)).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          current: { version: 3, clarifications: [{ status: "answered" }] },
        },
      });
      const nextQuestionId = crypto.randomUUID();
      await ask(id, 3, "Next", nextQuestionId);
      const raced = await Promise.all([
        answer(roundId, id, nextQuestionId, 4),
        close(id, nextQuestionId, 4),
      ]);
      expect(raced.filter((result) => result.ok)).toHaveLength(1);
      expect((await readItem(id)).version).toBe(5);
    });

    it("serializes a question against completion and replays successful actions even after completion", async () => {
      const { roundId, itemIds } = await setup();
      for (const id of itemIds)
        await setFeedbackItemResult(
          id,
          { version: 1, result: FeedbackItemResult.Implemented },
          f.member(),
        );
      await changeFeedbackRoundStatus(
        roundId,
        { version: 3, to: R.InProgress },
        f.member(),
      );
      const questionId = crypto.randomUUID();
      const raced = await Promise.all([
        ask(itemIds[0], 2, "Question", questionId),
        changeFeedbackRoundStatus(
          roundId,
          { version: 4, to: R.Completed },
          f.member(),
        ),
      ]);
      expect(raced.filter((result) => result.ok)).toHaveLength(1);
      if (raced[0].ok) {
        await close(itemIds[0], questionId, 3);
        await setFeedbackItemResult(
          itemIds[0],
          { version: 4, result: FeedbackItemResult.Implemented },
          f.member(),
        );
        await changeFeedbackRoundStatus(
          roundId,
          { version: 4, to: R.Completed },
          f.member(),
        );
        expect(await ask(itemIds[0], 2, "Question", questionId)).toMatchObject({
          ok: true,
          item: { version: 5 },
        });
      }
      expect(
        await ask(itemIds[0], (await readItem(itemIds[0])).version),
      ).toMatchObject({ ok: false, code: E.RoundLocked });
    });

    it("rejects foreign entities and missing write rights without exposing their data", async () => {
      const {
        roundId,
        projectId,
        itemIds: [id, other],
      } = await setup();
      const questionId = crypto.randomUUID();
      await ask(id, 1, "Question", questionId);
      const input = {
        version: 2,
        commandId: crypto.randomUUID(),
        answer: "Home",
      };
      expect(
        await answerPortalFeedbackClarification(
          f.contact([Permission.PortalFeedbackRead]),
          roundId,
          id,
          questionId,
          input,
        ),
      ).toMatchObject({ ok: false, code: P.NotFound });
      expect(
        await answerPortalFeedbackClarification(
          f.contact(undefined, f.foreignCustomerId),
          roundId,
          id,
          questionId,
          input,
        ),
      ).toMatchObject({ ok: false, code: P.NotFound });
      expect(
        await answerPortalFeedbackClarification(
          f.contact(),
          roundId,
          other,
          questionId,
          input,
        ),
      ).toMatchObject({ ok: false, code: P.NotFound });
      const otherRound = await setup();
      expect(
        await answerPortalFeedbackClarification(
          f.contact(),
          otherRound.roundId,
          id,
          questionId,
          input,
        ),
      ).toMatchObject({ ok: false, code: P.NotFound });
      expect(
        await askFeedbackItemClarification(
          id,
          { version: 2, commandId: crypto.randomUUID(), question: "Question" },
          f.member([]),
        ),
      ).toMatchObject({ ok: false, code: E.ItemNotFound });
      await f
        .database()
        .update(projects)
        .set({ status: "archived" })
        .where(eq(projects.id, projectId));
      expect(
        await answerPortalFeedbackClarification(
          f.contact(),
          roundId,
          id,
          questionId,
          input,
        ),
      ).toMatchObject({ ok: false, code: P.NotFound });
    });

    it("rolls back inserted questions and resets if history recording fails", async () => {
      const {
        itemIds: [id],
      } = await setup();
      await setFeedbackItemResult(
        id,
        { version: 1, result: FeedbackItemResult.Implemented },
        f.member(),
      );
      const before = await readItem(id);
      const original = feedbackResultHistoryService.recordChange;
      const failing = vi
        .spyOn(feedbackResultHistoryService, "recordChange")
        .mockImplementationOnce(async (...args) => {
          await original(...args);
          throw new Error("Forced history failure");
        });
      await expect(ask(id, 2)).rejects.toThrow("Forced history failure");
      failing.mockRestore();
      expect(await readItem(id)).toEqual(before);
      expect(
        await f
          .database()
          .select()
          .from(feedbackRoundItemClarifications)
          .where(eq(feedbackRoundItemClarifications.item_id, id)),
      ).toEqual([]);
      expect(
        (
          await feedbackResultHistoryService.loadByItems(f.database(), [id])
        ).get(id),
      ).toHaveLength(1);
    });

    it("rolls back an answered question if the item update fails, and isolates chat failures", async () => {
      const {
        roundId,
        itemIds: [id],
      } = await setup();
      const questionId = crypto.randomUUID();
      const chatError = vi.spyOn(console, "error").mockImplementation(() => {});
      const beforeQuestions = await chatCount(
        SystemMessageKey.FeedbackClarificationRequested,
      );
      const beforeAnswers = await chatCount(
        SystemMessageKey.FeedbackClarificationAnswered,
      );
      const originalNotice = messageService.appendSystemMessage;
      const chat = vi
        .spyOn(messageService, "appendSystemMessage")
        .mockImplementation(async (...args) => {
          await originalNotice(...args);
          throw new Error("Forced chat failure after message insert");
        });
      expect(await ask(id, 1, "Question", questionId)).toMatchObject({
        ok: true,
      });
      const original = feedbackClarificationService.writeItem;
      const failing = vi
        .spyOn(feedbackClarificationService, "writeItem")
        .mockImplementationOnce(async (...args) => {
          await original(...args);
          throw new Error("Forced item failure");
        });
      await expect(answer(roundId, id, questionId, 2)).rejects.toThrow(
        "Forced item failure",
      );
      failing.mockRestore();
      expect((await readItem(id)).version).toBe(2);
      const [question] = await f
        .database()
        .select()
        .from(feedbackRoundItemClarifications)
        .where(eq(feedbackRoundItemClarifications.id, questionId));
      expect(question).toMatchObject({
        status: "open",
        answer: null,
        version: 1,
      });
      expect(await answer(roundId, id, questionId, 2)).toMatchObject({
        ok: true,
        value: { version: 3 },
      });
      expect(chatError).toHaveBeenCalled();
      expect(
        await chatCount(SystemMessageKey.FeedbackClarificationRequested),
      ).toBe(beforeQuestions);
      expect(
        await chatCount(SystemMessageKey.FeedbackClarificationAnswered),
      ).toBe(beforeAnswers);
      chat.mockRestore();
      chatError.mockRestore();
    });
  },
);
