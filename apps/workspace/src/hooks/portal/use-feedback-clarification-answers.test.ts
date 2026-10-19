// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackItemDto } from "@invessiv/common/contracts/portal/portal-feedback-item.dto";
import { FeedbackAnswerProblem } from "@/common/constants/portal/feedback-answer-problems";
import { useFeedbackClarificationAnswers } from "./use-feedback-clarification-answers";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  answerClarification: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/portal/portal-feedback-api-service", () => ({
  portalFeedbackApiService: {
    answerClarification: mocks.answerClarification,
  },
}));

function item(
  id: string,
  status: FeedbackClarificationStatus = FeedbackClarificationStatus.Open,
  version = 1,
): PortalFeedbackItemDto {
  return {
    id,
    version,
    clarifications: [
      {
        id: `q-${id}`,
        status,
        question: "Which?",
        requestedAt: "2026-10-01T10:00:00.000Z",
        answer: null,
        answeredAt: null,
        closeNote: null,
        closedAt: null,
      },
    ],
    position: 0,
    areaLabel: null,
    kind: null,
    body: "Point",
    result: null,
    resultNote: null,
    attachments: [],
  };
}

function setup() {
  const onAnswered = vi.fn();
  const hook = renderHook(() =>
    useFeedbackClarificationAnswers("customer-1", "round-1", onAnswered),
  );
  return { hook, onAnswered };
}

describe("useFeedbackClarificationAnswers", () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.answerClarification.mockReset();
  });

  it("keeps drafts per question and drops only the answered one", async () => {
    mocks.answerClarification.mockResolvedValue({
      ok: true,
      item: item("a", FeedbackClarificationStatus.Answered, 2),
    });
    const { hook, onAnswered } = setup();
    act(() => {
      hook.result.current.change("a", "q-a", "Blue");
      hook.result.current.change("b", "q-b", "Green");
    });
    await act(() => hook.result.current.submit(item("a"), "q-a"));

    expect(mocks.answerClarification).toHaveBeenCalledWith(
      "customer-1",
      { roundId: "round-1", itemId: "a", clarificationId: "q-a" },
      { commandId: expect.any(String), version: 1, answer: "Blue" },
    );
    expect(hook.result.current.draftFor("q-a")).toBeNull();
    expect(hook.result.current.draftFor("q-b")?.text).toBe("Green");
    expect(hook.result.current.itemFor(item("a")).version).toBe(2);
    expect(onAnswered).toHaveBeenCalledWith("a");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("never sends an empty answer", async () => {
    const { hook } = setup();
    await act(() => hook.result.current.submit(item("a"), "q-a"));
    expect(hook.result.current.draftFor("q-a")?.problem).toBe(
      FeedbackAnswerProblem.Required,
    );
    expect(mocks.answerClarification).not.toHaveBeenCalled();
  });

  it("blocks a question that is no longer open and lists it as stale", async () => {
    mocks.answerClarification.mockResolvedValue({
      ok: false,
      code: PortalFeedbackErrorCode.ClarificationNotOpen,
      current: item("a", FeedbackClarificationStatus.Closed, 2),
    });
    const { hook } = setup();
    act(() => hook.result.current.change("a", "q-a", "Late"));
    await act(() => hook.result.current.submit(item("a"), "q-a"));

    expect(hook.result.current.staleDraftsOf("a", null)).toEqual([
      expect.objectContaining({
        text: "Late",
        locked: true,
        problem: FeedbackAnswerProblem.NotOpen,
      }),
    ]);
    expect(mocks.refresh).toHaveBeenCalledOnce();
    act(() => hook.result.current.change("a", "q-a", "Changed"));
    expect(hook.result.current.draftFor("q-a")?.text).toBe("Late");
    await act(() => hook.result.current.submit(item("a"), "q-a"));
    expect(mocks.answerClarification).toHaveBeenCalledOnce();
  });

  it("keeps the command id for a retry after a failure", async () => {
    mocks.answerClarification.mockResolvedValue({
      ok: false,
      code: PortalFeedbackErrorCode.Unavailable,
    });
    const { hook } = setup();
    act(() => hook.result.current.change("a", "q-a", "Blue"));
    await act(() => hook.result.current.submit(item("a"), "q-a"));
    await act(() => hook.result.current.submit(item("a"), "q-a"));
    const [first, second] = mocks.answerClarification.mock.calls.map(
      ([, , request]) => request.commandId,
    );
    expect(second).toBe(first);
    expect(hook.result.current.draftFor("q-a")?.problem).toBe(
      FeedbackAnswerProblem.Failure,
    );
  });

  it("keeps the pending answer immutable and blocks another submit until it finishes", async () => {
    let resolveAnswer!: (value: {
      ok: false;
      code: typeof PortalFeedbackErrorCode.Unavailable;
    }) => void;
    mocks.answerClarification.mockReturnValue(
      new Promise((resolve) => {
        resolveAnswer = resolve;
      }),
    );
    const { hook } = setup();
    act(() => hook.result.current.change("a", "q-a", "Blue"));
    const commandId = hook.result.current.draftFor("q-a")?.commandId;
    let submission!: Promise<void>;
    act(() => {
      submission = hook.result.current.submit(item("a"), "q-a");
    });
    act(() => hook.result.current.change("a", "q-a", "Green"));
    expect(hook.result.current.draftFor("q-a")).toMatchObject({
      text: "Blue",
      commandId,
      busy: true,
    });
    await act(() => hook.result.current.submit(item("a"), "q-a"));
    expect(mocks.answerClarification).toHaveBeenCalledOnce();
    await act(async () => {
      resolveAnswer({ ok: false, code: PortalFeedbackErrorCode.Unavailable });
      await submission;
    });
    act(() => hook.result.current.change("a", "q-a", "Green"));
    expect(hook.result.current.draftFor("q-a")?.text).toBe("Green");
  });

  it("refreshes the page after a conflict so the rest catches up with the adopted item", async () => {
    mocks.answerClarification.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: item("a", FeedbackClarificationStatus.Open, 2),
    });
    const { hook } = setup();
    act(() => hook.result.current.change("a", "q-a", "Blue"));
    await act(() => hook.result.current.submit(item("a"), "q-a"));
    expect(hook.result.current.draftFor("q-a")).toMatchObject({
      text: "Blue",
      locked: false,
      problem: FeedbackAnswerProblem.Conflict,
    });
    expect(hook.result.current.itemFor(item("a")).version).toBe(2);
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("drops empty drafts of finished questions and discards a kept one on request", () => {
    const { hook } = setup();
    act(() => {
      hook.result.current.change("a", "q-a", "   ");
      hook.result.current.change("a", "q-old", "Kept");
    });
    expect(
      hook.result.current.staleDraftsOf("a", null).map((draft) => draft.text),
    ).toEqual(["Kept"]);
    act(() => hook.result.current.discard("q-old"));
    expect(hook.result.current.staleDraftsOf("a", null)).toEqual([]);
  });
});
