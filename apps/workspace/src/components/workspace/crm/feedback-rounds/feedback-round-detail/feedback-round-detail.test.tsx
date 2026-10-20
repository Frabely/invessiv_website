// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackResultActorSide } from "@invessiv/common/constants/crm/feedback-result-actor-sides";
import { FeedbackResultHistoryEventKind } from "@invessiv/common/constants/crm/feedback-result-history-event-kinds";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { FeedbackItemInternalClarificationDto } from "@invessiv/common/contracts/crm/feedback-item-internal-clarification.dto";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import {
  getCrmFeedbackRoundsDictionary,
  getCrmFilesDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { FeedbackRoundDetail } from "./feedback-round-detail";

const mocks = vi.hoisted(() => ({
  router: { refresh: vi.fn(), replace: vi.fn() },
  changeStatus: vi.fn(),
  setItemResult: vi.fn(),
  askClarification: vi.fn(),
  closeClarification: vi.fn(),
  markRead: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
  usePathname: () => "/en/crm",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/client/crm/feedback-rounds-api-service", () => ({
  feedbackRoundsApiService: {
    changeStatus: mocks.changeStatus,
    setItemResult: mocks.setItemResult,
    askClarification: mocks.askClarification,
    closeClarification: mocks.closeClarification,
    markRead: mocks.markRead,
  },
}));

const content = getCrmFeedbackRoundsDictionary("en");
const filesContent = getCrmFilesDictionary("en");

function item(
  id: string,
  overrides: Partial<FeedbackRoundItemDto> = {},
): FeedbackRoundItemDto {
  return {
    id,
    position: 0,
    areaLabel: null,
    kind: null,
    body: `Point ${id}`,
    createdByPortalMembershipId: null,
    result: null,
    resultNote: null,
    resultSetByMemberId: null,
    resultSetAt: null,
    attachments: [],
    resultHistory: [],
    clarifications: [],
    version: 1,
    ...overrides,
  };
}

function clarification(
  id: string,
  overrides: Partial<FeedbackItemInternalClarificationDto> = {},
): FeedbackItemInternalClarificationDto {
  return {
    id,
    status: FeedbackClarificationStatus.Open,
    question: `Question ${id}`,
    requestedAt: "2026-10-01T10:00:00.000Z",
    answer: null,
    answeredAt: null,
    closeNote: null,
    closedAt: null,
    requestedByName: "Anna",
    answeredByName: null,
    closedByName: null,
    ...overrides,
  };
}

function round(overrides: Partial<FeedbackRoundDto> = {}): FeedbackRoundDto {
  return {
    id: "round-1",
    projectId: "project-1",
    customerId: "customer-1",
    roundNumber: 1,
    status: FeedbackRoundStatus.Submitted,
    previewUrl: null,
    handoverNote: null,
    dueOn: null,
    areaOptions: [],
    handedOverByMemberId: "member-1",
    handedOverAt: "2026-09-28T09:00:00.000Z",
    draftUpdatedAt: null,
    draftUpdatedByName: null,
    submittedAt: "2026-09-29T09:00:00.000Z",
    submittedByPortalMembershipId: null,
    submittedByName: null,
    customerNotice: null,
    startedAt: null,
    completedAt: null,
    completedByMemberId: null,
    approvedAt: null,
    approvedByPortalMembershipId: null,
    readAt: null,
    items: [item("a"), item("b")],
    version: 3,
    createdAt: "2026-09-28T09:00:00.000Z",
    updatedAt: "2026-09-29T09:00:00.000Z",
    ...overrides,
  };
}

function renderDetail(
  detail: FeedbackRoundDto,
  options: { canWrite?: boolean; included?: number } = {},
) {
  const onHandOverNextAction = vi.fn();
  const onAnnounceAction = vi.fn();
  const view = (detail: FeedbackRoundDto) => (
    <FeedbackRoundDetail
      backHref="/en/crm"
      canReadFiles
      canWrite={options.canWrite ?? true}
      content={content}
      customerId="customer-1"
      filesContent={filesContent}
      feedbackRoundPositions={[1, 1]}
      included={options.included ?? 2}
      locale="en"
      onAnnounceAction={onAnnounceAction}
      onHandOverNextAction={onHandOverNextAction}
      processSteps={["Design", "Development"]}
      round={detail}
    />
  );
  const rendered = render(view(detail));
  return {
    onHandOverNextAction,
    onAnnounceAction,
    rerender: (next: FeedbackRoundDto) => rendered.rerender(view(next)),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.markRead.mockResolvedValue(false);
});

it("resets a rated item without a dialog and announces pending", async () => {
  mocks.setItemResult.mockResolvedValue({
    ok: true,
    value: item("a", { version: 2 }),
  });
  const { onAnnounceAction } = renderDetail(
    round({ items: [item("a", { result: FeedbackItemResult.Implemented })] }),
  );
  fireEvent.click(screen.getByRole("button", { name: /Result for item 1:/ }));
  fireEvent.click(
    screen.getByRole("option", { name: content.result.choices.pending }),
  );
  await waitFor(() =>
    expect(mocks.setItemResult).toHaveBeenCalledWith("a", {
      version: 1,
      commandId: expect.any(String),
      result: null,
      resultNote: null,
    }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(onAnnounceAction).toHaveBeenCalledWith("Item 1 is pending again.");
});

it("keeps the internal history readable after a round was returned to the customer", () => {
  renderDetail(
    round({
      status: FeedbackRoundStatus.Open,
      items: [
        item("a", {
          resultHistory: [
            {
              id: "event",
              kind: FeedbackResultHistoryEventKind.Reset,
              itemVersion: 2,
              result: null,
              resultNote: null,
              actorSide: FeedbackResultActorSide.Member,
              actorName: null,
              occurredAt: "2026-10-01T10:00:00.000Z",
            },
          ],
        }),
      ],
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Result history (1)" }));
  expect(screen.getByText(content.result.history.reset)).toBeVisible();
  expect(
    screen.queryByRole("button", { name: /Result for item/ }),
  ).not.toBeInTheDocument();
});

describe("FeedbackRoundDetail read stamp", () => {
  it("stamps an unread round once and refreshes the counter", async () => {
    mocks.markRead.mockResolvedValue(true);
    renderDetail(round());
    await waitFor(() => expect(mocks.router.refresh).toHaveBeenCalledTimes(1));
    expect(mocks.markRead).toHaveBeenCalledTimes(1);
    expect(mocks.markRead).toHaveBeenCalledWith("round-1", { version: 3 });
    expect(mocks.changeStatus).not.toHaveBeenCalled();
  });

  it("leaves read rounds and rounds still with the customer alone", () => {
    renderDetail(round({ readAt: "2026-09-29T10:00:00.000Z" }));
    cleanup();
    renderDetail(
      round({ status: FeedbackRoundStatus.Open, submittedAt: null }),
    );
    expect(mocks.markRead).not.toHaveBeenCalled();
  });

  it("keeps the view when the stamp fails", async () => {
    mocks.markRead.mockResolvedValue(false);
    renderDetail(round());
    await waitFor(() => expect(mocks.markRead).toHaveBeenCalled());
    expect(mocks.router.refresh).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Feedback round 1" }),
    ).toBeInTheDocument();
  });
});

afterEach(cleanup);

describe("FeedbackRoundDetail processing", () => {
  it("offers exactly the team's allowed steps for a submitted round", () => {
    renderDetail(round());
    const group = screen.getByRole("group", {
      name: content.actions.groupLabel,
    });
    expect(
      within(group)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual([content.actions.in_discussion, content.actions.in_progress]);
    expect(
      screen.queryByRole("button", { name: /hand back/i }),
    ).not.toBeInTheDocument();
  });

  it("offers only the completion while the team implements", () => {
    renderDetail(round({ status: FeedbackRoundStatus.InProgress }));
    const group = screen.getByRole("group", {
      name: content.actions.groupLabel,
    });
    expect(within(group).getAllByRole("button")).toHaveLength(1);
    expect(
      within(group).getByRole("button", { name: content.actions.completed }),
    ).toBeInTheDocument();
  });

  it("shows no steps and no result controls without projects.write", () => {
    renderDetail(round(), { canWrite: false });
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Result for item/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(content.result.choices.pending)).toHaveLength(2);
  });

  it("starts the implementation directly and refreshes", async () => {
    mocks.changeStatus.mockResolvedValue({
      ok: true,
      value: round({ status: FeedbackRoundStatus.InProgress, version: 4 }),
    });
    renderDetail(round());
    fireEvent.click(
      screen.getByRole("button", { name: content.actions.in_progress }),
    );
    await waitFor(() => expect(mocks.router.refresh).toHaveBeenCalled());
    expect(mocks.changeStatus).toHaveBeenCalledWith("round-1", {
      version: 3,
      to: FeedbackRoundStatus.InProgress,
    });
  });

  it("saves implemented at once and asks for a reply for the other results", async () => {
    mocks.setItemResult.mockResolvedValue({
      ok: true,
      value: item("a", { result: FeedbackItemResult.Implemented, version: 2 }),
    });
    renderDetail(round({ status: FeedbackRoundStatus.InProgress }));
    const [first, second] = screen.getAllByRole("button", {
      name: /Result for item/,
    });

    fireEvent.click(first);
    fireEvent.click(
      screen.getByRole("option", {
        name: content.result.choices.implemented,
      }),
    );
    await waitFor(() =>
      expect(mocks.setItemResult).toHaveBeenCalledWith("a", {
        commandId: expect.any(String),
        version: 1,
        result: FeedbackItemResult.Implemented,
        resultNote: null,
      }),
    );

    fireEvent.click(second);
    fireEvent.click(
      screen.getByRole("option", {
        name: content.result.choices.additional_service,
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Reply to item 2" }),
    ).toBeInTheDocument();
    expect(mocks.setItemResult).toHaveBeenCalledTimes(1);
  });

  it("shows the rating progress and the customer notice of a requested call", () => {
    renderDetail(
      round({
        status: FeedbackRoundStatus.InDiscussion,
        customerNotice: "Thursday?",
        items: [
          item("a", { result: FeedbackItemResult.Implemented }),
          item("b"),
        ],
      }),
    );
    expect(screen.getByText("1 of 2 items done")).toBeInTheDocument();
    expect(screen.getByText("Thursday?")).toBeInTheDocument();
  });

  it("keeps the completion closed until every item has a result", () => {
    renderDetail(round({ status: FeedbackRoundStatus.InProgress }));
    fireEvent.click(
      screen.getByRole("button", { name: content.actions.completed }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: content.complete.submit }),
    ).toBeDisabled();
    expect(
      within(dialog).getByText(
        "2 of 2 items have no result yet. Rate them before you complete the round.",
      ),
    ).toBeInTheDocument();
  });

  it("offers the next round after the completion while the track has one", async () => {
    const rated = round({
      status: FeedbackRoundStatus.InProgress,
      items: [
        item("a", { result: FeedbackItemResult.Implemented }),
        item("b", {
          result: FeedbackItemResult.NotImplemented,
          resultNote: "Later",
        }),
      ],
    });
    mocks.changeStatus.mockResolvedValue({
      ok: true,
      value: { ...rated, status: FeedbackRoundStatus.Completed, version: 5 },
    });
    const { onHandOverNextAction } = renderDetail(rated);
    fireEvent.click(
      screen.getByRole("button", { name: content.actions.completed }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: content.complete.submit,
      }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Hand over round 2" }),
    );
    expect(onHandOverNextAction).toHaveBeenCalledOnce();
  });

  it("points to the approval after the last round", async () => {
    const rated = round({
      roundNumber: 2,
      status: FeedbackRoundStatus.InProgress,
      items: [item("a", { result: FeedbackItemResult.Implemented })],
    });
    mocks.changeStatus.mockResolvedValue({
      ok: true,
      value: { ...rated, status: FeedbackRoundStatus.Completed, version: 5 },
    });
    renderDetail(rated, { included: 2 });
    fireEvent.click(
      screen.getByRole("button", { name: content.actions.completed }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: content.complete.submit,
      }),
    );
    expect(
      await screen.findByText(content.complete.approvalHint),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Hand over round/ }),
    ).not.toBeInTheDocument();
  });
});

describe("FeedbackRoundDetail clarifications", () => {
  it("preserves the close draft and original target across answered, new-question and locked refreshes", async () => {
    const original = clarification("q");
    const answered = clarification("q", {
      status: FeedbackClarificationStatus.Answered,
      answer: "Use the header",
      answeredAt: "2026-10-02T10:00:00.000Z",
    });
    const { rerender } = renderDetail(
      round({ items: [item("a", { clarifications: [original] })] }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Close question (item 1)" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "Settled by phone" },
    });
    const refreshed = item("a", {
      version: 3,
      clarifications: [answered, clarification("new")],
    });
    rerender(
      round({ items: [item("a", { version: 2, clarifications: [answered] })] }),
    );
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("textbox")).toHaveValue("Settled by phone");
    rerender(round({ items: [refreshed] }));
    mocks.closeClarification.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: refreshed,
    });
    fireEvent.submit(dialog.querySelector("form")!);
    await within(dialog).findByText(content.clarification.closeDialog.conflict);
    expect(mocks.closeClarification).toHaveBeenCalledWith(
      "a",
      "q",
      expect.anything(),
    );
    fireEvent.submit(dialog.querySelector("form")!);
    await within(dialog).findByText(content.processingErrors.changed);
    expect(mocks.closeClarification).toHaveBeenCalledOnce();
    rerender(
      round({ status: FeedbackRoundStatus.Completed, items: [refreshed] }),
    );
    expect(within(dialog).getByRole("textbox")).toHaveValue("Settled by phone");
    expect(within(dialog).getByRole("textbox")).toHaveAttribute("readonly");
    expect(
      within(dialog).getByRole("button", {
        name: content.clarification.closeDialog.submit,
      }),
    ).toBeDisabled();
  });

  it.each([
    ConcurrencyErrorCode.VersionConflict,
    FeedbackRoundErrorCode.ClarificationNotOpen,
  ])(
    "shows the answered point from a %s conflict without discarding the close draft",
    async (code) => {
      mocks.closeClarification.mockResolvedValue({
        ok: false,
        code,
        current: item("a", {
          version: 2,
          clarifications: [
            clarification("q", {
              status: FeedbackClarificationStatus.Answered,
              answer: "Use the header",
              answeredAt: "2026-10-02T10:00:00.000Z",
            }),
          ],
        }),
      });
      renderDetail(
        round({ items: [item("a", { clarifications: [clarification("q")] })] }),
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Close question (item 1)" }),
      );
      const dialog = screen.getByRole("dialog");
      fireEvent.change(within(dialog).getByRole("textbox"), {
        target: { value: "My unsent note" },
      });
      fireEvent.submit(dialog.querySelector("form")!);
      await screen.findByText("Use the header");
      expect(within(dialog).getByRole("textbox")).toHaveValue("My unsent note");
      expect(mocks.router.refresh).toHaveBeenCalled();
      fireEvent.submit(dialog.querySelector("form")!);
      await within(dialog).findByText(content.processingErrors.changed);
      expect(mocks.closeClarification).toHaveBeenCalledOnce();
    },
  );

  it.each([
    FeedbackItemResult.Implemented,
    FeedbackItemResult.AdditionalService,
  ])(
    "updates the withdrawal notice to the conflicted result %s before retrying",
    async (result) => {
      mocks.askClarification
        .mockResolvedValueOnce({
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          current: item("a", {
            version: 2,
            result,
            resultNote: "New explanation",
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          code: FeedbackRoundErrorCode.Internal,
        });
      renderDetail(round({ items: [item("a")] }));
      fireEvent.click(
        screen.getByRole("button", { name: "Ask a question (item 1)" }),
      );
      const dialog = screen.getByRole("dialog");
      fireEvent.change(within(dialog).getByRole("textbox"), {
        target: { value: "Which blue?" },
      });
      fireEvent.submit(dialog.querySelector("form")!);
      await within(dialog).findByText(
        `The result “${content.result.choices[result]}” is withdrawn and stays in the result history.`,
      );
      fireEvent.submit(dialog.querySelector("form")!);
      await waitFor(() =>
        expect(mocks.askClarification).toHaveBeenCalledTimes(2),
      );
      expect(mocks.askClarification.mock.calls[1][1]).toMatchObject({
        version: 2,
        question: "Which blue?",
      });
      expect(mocks.askClarification.mock.calls[1][1].commandId).not.toBe(
        mocks.askClarification.mock.calls[0][1].commandId,
      );
    },
  );

  it("keeps a pending internal draft immutable and refreshes a locked-round refusal", async () => {
    let finish!: (value: {
      ok: false;
      code: typeof FeedbackRoundErrorCode.RoundLocked;
    }) => void;
    mocks.askClarification.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderDetail(round({ items: [item("a")] }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ask a question (item 1)" }),
    );
    const dialog = screen.getByRole("dialog");
    const field = within(dialog).getByRole("textbox");
    fireEvent.change(field, { target: { value: "Sent text" } });
    fireEvent.submit(dialog.querySelector("form")!);
    expect(field).toHaveAttribute("readonly");
    fireEvent.change(field, { target: { value: "Unsent edit" } });
    expect(field).toHaveValue("Sent text");
    finish({ ok: false, code: FeedbackRoundErrorCode.RoundLocked });
    await within(dialog).findByText(content.processingErrors.locked);
    expect(field).toHaveValue("Sent text");
    expect(mocks.router.refresh).toHaveBeenCalled();
  });

  it("asks a question on a rated item and names the withdrawn result", async () => {
    mocks.askClarification.mockResolvedValue({
      ok: true,
      value: item("a", { version: 2, clarifications: [clarification("q")] }),
    });
    const { onAnnounceAction } = renderDetail(
      round({
        status: FeedbackRoundStatus.InProgress,
        items: [item("a", { result: FeedbackItemResult.Implemented })],
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Ask a question (item 1)" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Question about item 1",
    });
    expect(
      within(dialog).getByText(
        "The result “Implemented” is withdrawn and stays in the result history.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: content.clarification.askDialog.submit,
      }),
    );
    expect(
      await within(dialog).findByText(content.clarification.askDialog.required),
    ).toBeInTheDocument();
    expect(mocks.askClarification).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "  Which blue?  " },
    });
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: content.clarification.askDialog.submit,
      }),
    );
    await waitFor(() =>
      expect(mocks.askClarification).toHaveBeenCalledWith("a", {
        commandId: expect.any(String),
        version: 1,
        question: "Which blue?",
      }),
    );
    expect(onAnnounceAction).toHaveBeenCalledWith("Item 1: question asked.");
  });

  it("keeps the command id for a retry and renews it after a conflict", async () => {
    mocks.askClarification
      .mockResolvedValueOnce({
        ok: false,
        code: FeedbackRoundErrorCode.Internal,
      })
      .mockResolvedValueOnce({
        ok: false,
        code: FeedbackRoundErrorCode.Internal,
      })
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: item("a", { version: 2 }),
      })
      .mockResolvedValueOnce({
        ok: false,
        code: FeedbackRoundErrorCode.Internal,
      });
    renderDetail(round({ items: [item("a")] }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ask a question (item 1)" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "Which blue?" },
    });
    const submit = within(dialog).getByRole("button", {
      name: content.clarification.askDialog.submit,
    });
    for (let call = 1; call <= 4; call += 1) {
      fireEvent.click(submit);
      await waitFor(() =>
        expect(mocks.askClarification).toHaveBeenCalledTimes(call),
      );
      await waitFor(() => expect(submit).not.toBeDisabled());
    }
    const ids = mocks.askClarification.mock.calls.map(
      ([, request]) => request.commandId,
    );
    expect(ids[1]).toBe(ids[0]);
    expect(ids[2]).toBe(ids[1]);
    expect(ids[3]).not.toBe(ids[2]);
    expect(mocks.askClarification.mock.calls[3][1].version).toBe(2);
  });

  it("locks the result while a question is open and closes it only with a note", async () => {
    mocks.closeClarification.mockResolvedValue({
      ok: true,
      value: item("a", { version: 3 }),
    });
    const { onAnnounceAction } = renderDetail(
      round({
        status: FeedbackRoundStatus.InProgress,
        items: [
          item("a", {
            version: 2,
            clarifications: [
              clarification("old", {
                status: FeedbackClarificationStatus.Answered,
                answer: "The dark one",
                answeredAt: "2026-09-30T10:00:00.000Z",
                answeredByName: "Kim",
                requestedAt: "2026-09-29T10:00:00.000Z",
              }),
              clarification("q"),
            ],
          }),
        ],
      }),
    );
    const select = screen.getByRole("button", { name: /Result for item 1:/ });
    expect(select).toBeDisabled();
    expect(select).toHaveTextContent(content.result.choices.clarification);
    const thread = screen.getByRole("region", {
      name: "Questions about item 1",
    });
    expect(within(thread).getByText("Question q")).toBeInTheDocument();
    expect(within(thread).getByText("The dark one")).toBeInTheDocument();
    expect(within(thread).getAllByText(/^Anna on/)).toHaveLength(2);
    expect(within(thread).getByText(/^Kim on/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Ask a question/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close question (item 1)",
      }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: content.clarification.closeDialog.submit,
      }),
    );
    expect(
      await within(dialog).findByText(
        content.clarification.closeDialog.required,
      ),
    ).toBeInTheDocument();
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "Settled on the phone" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: content.clarification.closeDialog.submit,
      }),
    );
    await waitFor(() =>
      expect(mocks.closeClarification).toHaveBeenCalledWith("a", "q", {
        commandId: expect.any(String),
        version: 2,
        note: "Settled on the phone",
      }),
    );
    expect(onAnnounceAction).toHaveBeenCalledWith("Item 1: question closed.");
  });

  it("counts open questions and keeps the completion closed while one is open", () => {
    renderDetail(
      round({
        status: FeedbackRoundStatus.InProgress,
        items: [
          item("a", { result: FeedbackItemResult.Implemented }),
          item("b", { clarifications: [clarification("q")] }),
        ],
      }),
    );
    expect(screen.getByText("1 of 2 items done")).toBeInTheDocument();
    expect(screen.getByText("1 question open")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: content.actions.completed }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: content.complete.submit }),
    ).toBeDisabled();
    expect(
      within(dialog).getByText(content.complete.clarificationsOpenOne),
    ).toBeInTheDocument();
  });

  it("shows the question as status text without projects.write", () => {
    renderDetail(
      round({ items: [item("a", { clarifications: [clarification("q")] })] }),
      { canWrite: false },
    );
    expect(
      screen.getByText(content.result.choices.clarification),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Close question/ }),
    ).not.toBeInTheDocument();
  });
});
