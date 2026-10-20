// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FeedbackClarificationStatus,
  type FeedbackClarificationStatus as FeedbackClarificationStatusValue,
} from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackItemDto } from "@invessiv/common/contracts/portal/portal-feedback-item.dto";
import {
  getPortalFeedbackDictionary,
  getPortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { FeedbackPageView } from "./feedback-page-view";
import {
  portalFeedbackRound as round,
  portalProjectFeedback as feedback,
} from "@/test/fixtures/portal-feedback";
import { renderPortalFeedbackView as renderView } from "@/test/portal/render-portal-feedback-view";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  answerClarification: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
  usePathname: () => "/en/portal/customer-1/projects/project-1/feedback",
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("@/client/portal/portal-feedback-api-service", () => ({
  portalFeedbackApiService: { answerClarification: mocks.answerClarification },
}));
const content = getPortalFeedbackDictionary("en");
const filesContent = getPortalFilesDictionary("en");

describe("FeedbackPageView clarifications", () => {
  function question(
    id: string,
    status: FeedbackClarificationStatusValue = FeedbackClarificationStatus.Open,
  ) {
    return {
      id,
      status,
      question: `Question ${id}`,
      requestedAt: "2026-10-01T10:00:00.000Z",
      answer: status === FeedbackClarificationStatus.Answered ? "Done" : null,
      answeredAt:
        status === FeedbackClarificationStatus.Answered
          ? "2026-10-02T10:00:00.000Z"
          : null,
      closeNote:
        status === FeedbackClarificationStatus.Closed ? "Settled" : null,
      closedAt:
        status === FeedbackClarificationStatus.Closed
          ? "2026-10-02T10:00:00.000Z"
          : null,
    };
  }

  function questionedItem(
    id: string,
    position: number,
    clarifications = [question(`q-${id}`)],
    version = 2,
  ): PortalFeedbackItemDto {
    return {
      id,
      version,
      clarifications,
      position,
      areaLabel: null,
      kind: null,
      body: `Point ${id}`,
      result: null,
      resultNote: null,
      attachments: [],
    };
  }

  function questioned(
    status: FeedbackRoundStatus = FeedbackRoundStatus.InProgress,
    items: PortalFeedbackItemDto[] = [
      questionedItem("a", 0),
      questionedItem("b", 1),
      questionedItem("c", 2, []),
    ],
    canSubmit = true,
  ) {
    return feedback({
      canSubmit,
      activeRound: round({
        status,
        submittedAt: "2026-09-30T10:00:00.000Z",
        items,
      }),
    });
  }

  function answerField(number: number) {
    return screen.getByRole("textbox", {
      name: new RegExp(`Your answer to point ${number}`),
    });
  }

  function staleField(number: number) {
    return screen.getByRole("textbox", {
      name: new RegExp(
        `Unsent answer to an earlier question on point ${number}`,
      ),
    });
  }

  function sendButtons() {
    return screen.getAllByRole("button", {
      name: content.clarifications.answer.submit,
    });
  }

  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.answerClarification.mockReset();
  });
  afterEach(cleanup);

  it.each([
    FeedbackRoundStatus.Submitted,
    FeedbackRoundStatus.InDiscussion,
    FeedbackRoundStatus.InProgress,
  ])(
    "offers the answer form on open questions while the round is %s",
    (status) => {
      renderView(questioned(status));
      expect(answerField(1)).toBeInTheDocument();
      expect(answerField(2)).toBeInTheDocument();
      expect(sendButtons()).toHaveLength(2);
    },
  );

  it("shows the thread without a form to readers, the owner view and finished questions", () => {
    renderView(questioned(FeedbackRoundStatus.InProgress, undefined, false));
    expect(
      screen.getByRole("region", { name: "Questions about point 1" }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    // Nobody here can answer, so nothing asks this viewer to.
    expect(
      screen.getByText(content.clarifications.noticeHintReadOnly),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(content.clarifications.thread.statusOpen).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(content.clarifications.statusWaiting),
    ).not.toBeInTheDocument();
    cleanup();

    renderView(
      questioned(FeedbackRoundStatus.InProgress, [
        questionedItem("a", 0, [
          question("q1", FeedbackClarificationStatus.Closed),
        ]),
      ]),
    );
    expect(screen.getByText("Settled")).toBeInTheDocument();
    expect(
      screen.getByText(content.clarifications.thread.statusClosed),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });

  it("names the open questions and jumps to the item heading", () => {
    renderView(questioned());
    expect(
      screen.getByRole("heading", { name: "We have 2 questions for you" }),
    ).toBeInTheDocument();
    const jumps = within(
      screen.getByRole("navigation", {
        name: content.clarifications.jumpLabel,
      }),
    ).getAllByRole("link");
    expect(jumps.map((link) => link.textContent)).toEqual([
      "Point 1",
      "Point 2",
    ]);
    fireEvent.click(jumps[1]);
    expect(document.getElementById("feedback-item-b")).toHaveFocus();
  });

  it("refuses an empty or too long answer without sending", async () => {
    renderView(questioned());
    fireEvent.click(sendButtons()[0]);
    expect(
      await screen.findByText(content.clarifications.answer.required),
    ).toBeInTheDocument();
    fireEvent.change(answerField(1), { target: { value: "x".repeat(2001) } });
    fireEvent.click(sendButtons()[0]);
    expect(
      await screen.findByText(/Your answer is too long/),
    ).toBeInTheDocument();
    expect(mocks.answerClarification).not.toHaveBeenCalled();
  });

  it("sends the answer, keeps the other draft and announces it on the item", async () => {
    mocks.answerClarification.mockResolvedValue({
      ok: true,
      item: questionedItem(
        "a",
        0,
        [question("q-a", FeedbackClarificationStatus.Answered)],
        3,
      ),
    });
    renderView(questioned());
    fireEvent.change(answerField(2), { target: { value: "Draft on b" } });
    fireEvent.change(answerField(1), { target: { value: "  The dark one  " } });
    fireEvent.click(sendButtons()[0]);

    await waitFor(() =>
      expect(mocks.answerClarification).toHaveBeenCalledWith(
        "customer-1",
        { roundId: "round-1", itemId: "a", clarificationId: "q-a" },
        { commandId: expect.any(String), version: 2, answer: "The dark one" },
      ),
    );
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your answer to point 1 is sent.",
    );
    expect(document.getElementById("feedback-item-a")).toHaveFocus();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(answerField(2)).toHaveValue("Draft on b");
  });

  it("keeps the text on a version conflict and sends the retry as a new action", async () => {
    mocks.answerClarification
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: questionedItem("a", 0, [question("q-a")], 5),
      })
      .mockResolvedValueOnce({
        ok: false,
        code: PortalFeedbackErrorCode.Unavailable,
      })
      .mockResolvedValueOnce({
        ok: false,
        code: PortalFeedbackErrorCode.Unavailable,
      });
    renderView(questioned());
    fireEvent.change(answerField(1), { target: { value: "Blue" } });
    fireEvent.click(sendButtons()[0]);
    expect(
      await screen.findByText(content.clarifications.answer.conflict),
    ).toBeInTheDocument();
    expect(answerField(1)).toHaveValue("Blue");

    fireEvent.click(sendButtons()[0]);
    await waitFor(() =>
      expect(mocks.answerClarification).toHaveBeenCalledTimes(2),
    );
    expect(
      await screen.findByText(content.errors.unavailable),
    ).toBeInTheDocument();
    fireEvent.click(sendButtons()[0]);
    await waitFor(() =>
      expect(mocks.answerClarification).toHaveBeenCalledTimes(3),
    );
    const [first, second, third] = mocks.answerClarification.mock.calls.map(
      ([, , request]) => request,
    );
    expect(second.commandId).not.toBe(first.commandId);
    expect(second.version).toBe(5);
    expect(third.commandId).toBe(second.commandId);
  });

  it("keeps the answer and prevents another submit after a locked-round error and refresh", async () => {
    mocks.answerClarification.mockResolvedValue({
      ok: false,
      code: PortalFeedbackErrorCode.Locked,
    });
    const { rerender } = renderView(questioned());
    fireEvent.change(answerField(1), { target: { value: "My unsent answer" } });
    fireEvent.click(sendButtons()[0]);
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(staleField(1)).toHaveAttribute("readonly");
    expect(staleField(1)).toHaveValue("My unsent answer");
    expect(
      screen.getByRole("button", {
        name: content.clarifications.answer.submit,
      }),
    ).not.toBeDisabled();
    rerender(
      <FeedbackPageView
        canUpload={false}
        cockpitHref={null}
        content={content}
        customerId="customer-1"
        dashboardHref="/en/portal/customer-1"
        feedback={questioned(FeedbackRoundStatus.Completed, [
          questionedItem(
            "a",
            0,
            [question("q-a", FeedbackClarificationStatus.Closed)],
            3,
          ),
        ])}
        filesContent={filesContent}
        locale="en"
        messagesHref={null}
      />,
    );
    expect(staleField(1)).toHaveValue("My unsent answer");
    expect(staleField(1)).toHaveAttribute("readonly");
    expect(
      screen.queryByRole("button", {
        name: content.clarifications.answer.submit,
      }),
    ).not.toBeInTheDocument();
    expect(mocks.answerClarification).toHaveBeenCalledOnce();
  });

  it("blocks a question that closed meanwhile and keeps the text", async () => {
    mocks.answerClarification.mockResolvedValue({
      ok: false,
      code: PortalFeedbackErrorCode.ClarificationNotOpen,
      current: questionedItem(
        "a",
        0,
        [question("q-a", FeedbackClarificationStatus.Closed)],
        3,
      ),
    });
    renderView(questioned());
    fireEvent.change(answerField(1), { target: { value: "Too late" } });
    fireEvent.click(sendButtons()[0]);
    expect(
      await screen.findByText(content.clarifications.answer.notOpen),
    ).toBeInTheDocument();
    expect(staleField(1)).toHaveValue("Too late");
    expect(staleField(1)).toHaveAttribute("readonly");
    expect(sendButtons()).toHaveLength(1);
    expect(mocks.refresh).toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", {
        name: content.clarifications.answer.discard,
      }),
    );
    expect(
      screen.queryByText(content.clarifications.answer.notOpen),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Settled")).toBeInTheDocument();
  });

  it.each([
    FeedbackClarificationStatus.Closed,
    FeedbackClarificationStatus.Answered,
  ])(
    "keeps the draft visible when a version conflict returns a question that is %s",
    async (status) => {
      mocks.answerClarification.mockResolvedValue({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: questionedItem(
          "a",
          0,
          [question("q-a", status), question("new-q")],
          3,
        ),
      });
      renderView(questioned());
      fireEvent.change(answerField(1), { target: { value: "My old answer" } });
      fireEvent.click(sendButtons()[0]);
      expect(
        await screen.findByText(content.clarifications.answer.notOpen),
      ).toBeVisible();
      // The kept draft and the form for the newer question carry different names.
      expect(staleField(1)).toHaveValue("My old answer");
      expect(staleField(1)).toHaveAttribute("readonly");
      expect(answerField(1)).toHaveValue("");
      expect(answerField(1)).not.toHaveAttribute("readonly");
      expect(mocks.answerClarification).toHaveBeenCalledOnce();
    },
  );

  it("keeps another item's draft visible when the answer refresh brings a closed question", async () => {
    mocks.answerClarification.mockResolvedValue({
      ok: true,
      item: questionedItem(
        "a",
        0,
        [question("q-a", FeedbackClarificationStatus.Answered)],
        3,
      ),
    });
    const { rerender } = renderView(questioned());
    fireEvent.change(answerField(2), { target: { value: "Draft on b" } });
    fireEvent.change(answerField(1), { target: { value: "Answer on a" } });
    fireEvent.click(sendButtons()[0]);
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    rerender(
      <FeedbackPageView
        canUpload={false}
        cockpitHref={null}
        content={content}
        customerId="customer-1"
        dashboardHref="/en/portal/customer-1"
        feedback={questioned(FeedbackRoundStatus.InProgress, [
          questionedItem(
            "a",
            0,
            [question("q-a", FeedbackClarificationStatus.Answered)],
            3,
          ),
          questionedItem(
            "b",
            1,
            [question("q-b", FeedbackClarificationStatus.Closed)],
            3,
          ),
        ])}
        filesContent={filesContent}
        locale="en"
        messagesHref={null}
      />,
    );
    expect(staleField(2)).toHaveValue("Draft on b");
    expect(staleField(2)).toHaveAttribute("readonly");
    expect(
      screen.getByText(content.clarifications.answer.notOpen),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", {
        name: content.clarifications.answer.submit,
      }),
    ).not.toBeInTheDocument();
  });
});
