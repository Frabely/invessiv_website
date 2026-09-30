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
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
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
    version: 1,
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
  render(
    <FeedbackRoundDetail
      backHref="/en/crm"
      canReadFiles
      canWrite={options.canWrite ?? true}
      content={content}
      customerId="customer-1"
      filesContent={filesContent}
      included={options.included ?? 2}
      locale="en"
      onAnnounceAction={vi.fn()}
      onHandOverNextAction={onHandOverNextAction}
      round={detail}
    />,
  );
  return { onHandOverNextAction };
}

beforeEach(() => {
  vi.resetAllMocks();
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
    ).toEqual([
      content.actions.in_discussion,
      content.actions.in_progress,
      content.actions.open,
    ]);
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

  it("requires a notice before handing the round back", async () => {
    renderDetail(round());
    fireEvent.click(screen.getByRole("button", { name: content.actions.open }));
    fireEvent.click(
      screen.getByRole("button", { name: content.notice.return.submit }),
    );
    expect(
      await screen.findByText(content.notice.return.required),
    ).toBeInTheDocument();
    expect(mocks.changeStatus).not.toHaveBeenCalled();

    mocks.changeStatus.mockResolvedValue({
      ok: true,
      value: round({ status: FeedbackRoundStatus.Open, version: 4 }),
    });
    fireEvent.change(
      screen.getByRole("textbox", {
        name: new RegExp(content.notice.return.label.replace("?", "\?")),
      }),
      { target: { value: "  Please add the screenshot  " } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.notice.return.submit }),
    );
    await waitFor(() =>
      expect(mocks.changeStatus).toHaveBeenCalledWith("round-1", {
        version: 3,
        to: FeedbackRoundStatus.Open,
        customerNotice: "Please add the screenshot",
      }),
    );
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
    expect(screen.getByText("1 of 2 items rated")).toBeInTheDocument();
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
