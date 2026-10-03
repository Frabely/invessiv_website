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
import { FeedbackHandOverBlocker } from "@invessiv/common/constants/crm/feedback-hand-over-blockers";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import type { FeedbackRoundSummaryDto } from "@invessiv/common/contracts/crm/feedback-round-summary.dto";
import type { FeedbackRoundsViewModel } from "@/common/contracts/crm/feedback-rounds-view-model";
import { feedbackRoundsApiService } from "@/client/crm/feedback-rounds-api-service";
import {
  getCrmFeedbackRoundsDictionary,
  getCrmFilesDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { ProjectFeedbackSection } from "./project-feedback-section";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  search: "cockpit=customer-1",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/en/crm",
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

vi.mock("@/client/crm/feedback-rounds-api-service", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/client/crm/feedback-rounds-api-service")
    >();
  return {
    feedbackRoundsApiService: {
      ...original.feedbackRoundsApiService,
      markRead: vi.fn().mockResolvedValue(false),
      changeStatus: vi.fn(),
    },
  };
});

const content = getCrmFeedbackRoundsDictionary("en");
const filesContent = getCrmFilesDictionary("en");

const SUMMARY: FeedbackRoundSummaryDto = {
  id: "round-1",
  roundNumber: 1,
  status: FeedbackRoundStatus.Submitted,
  handedOverAt: "2026-09-28T09:00:00.000Z",
  previewUrl: null,
  dueOn: null,
  submittedAt: "2026-09-29T09:00:00.000Z",
  completedAt: null,
  approvedAt: null,
  itemCount: 1,
  unread: true,
};

const DETAIL: FeedbackRoundDto = {
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
  submittedByPortalMembershipId: "membership-1",
  submittedByName: "Anna",
  customerNotice: null,
  startedAt: null,
  completedAt: null,
  completedByMemberId: null,
  approvedAt: null,
  approvedByPortalMembershipId: null,
  readAt: null,
  items: [
    {
      id: "item-1",
      position: 0,
      areaLabel: null,
      kind: null,
      body: "<script>alert(1)</script>",
      result: null,
      resultNote: null,
      resultSetByMemberId: null,
      resultSetAt: null,
      createdByPortalMembershipId: "membership-1",
      attachments: [],
      version: 1,
    },
  ],
  version: 2,
  createdAt: "2026-09-28T09:00:00.000Z",
  updatedAt: "2026-09-29T09:00:00.000Z",
};

function viewModel(
  overrides: Partial<FeedbackRoundsViewModel> = {},
  overview: Partial<FeedbackRoundsViewModel["overview"]> = {},
): FeedbackRoundsViewModel {
  return {
    projectId: "project-1",
    overview: {
      projectId: "project-1",
      quota: {
        included: 2,
        used: 0,
        remaining: 2,
        activeRoundNumber: null,
        approvedRoundNumber: null,
      },
      rounds: [],
      feedbackAreas: ["Home"],
      nextRoundNumber: 1,
      canHandOver: true,
      handOverBlocker: null,
      ...overview,
    },
    detail: null,
    canWrite: true,
    canReadFiles: true,
    defaultPreviewUrl: null,
    roundProgress: {
      activeRoundNumber: null,
      completedRoundNumber: null,
      approvedRoundNumber: null,
    },
    processSteps: ["Design", "Development", "Launch"],
    feedbackRoundPositions: [1, 2],
    ...overrides,
  };
}

function renderSection(model: FeedbackRoundsViewModel, expand = true) {
  const result = render(
    <ProjectFeedbackSection
      content={content}
      customerId="customer-1"
      filesContent={filesContent}
      locale="en"
      viewModel={model}
    />,
  );
  if (
    expand &&
    screen.queryByRole("button", { name: content.section.expandLabel })
  )
    fireEvent.click(
      screen.getByRole("button", { name: content.section.expandLabel }),
    );
  return result;
}

describe("ProjectFeedbackSection", () => {
  beforeEach(() => {
    navigation.replace.mockReset();
    navigation.search = "cockpit=customer-1";
  });
  afterEach(cleanup);

  it("starts closed and opens a deep-linked feedback round", () => {
    renderSection(viewModel(), false);
    expect(
      screen.getByRole("button", { name: content.section.expandLabel }),
    ).toHaveAttribute("aria-expanded", "false");
    cleanup();
    navigation.search = "cockpit=customer-1&feedbackRound=round-1";
    renderSection(viewModel({ detail: DETAIL }), false);
    expect(
      screen.getByRole("button", { name: content.section.collapseLabel }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
  });

  it("explains the purpose while no round was handed over and offers the first", () => {
    renderSection(viewModel());

    expect(screen.getByText(content.empty.title)).toBeInTheDocument();
    expect(screen.getByText(content.empty.description)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hand over round 1" }),
    ).toBeInTheDocument();
  });

  it("has no handover and no reason without projects.write", () => {
    renderSection(
      viewModel(
        { canWrite: false },
        {
          canHandOver: false,
          handOverBlocker: FeedbackHandOverBlocker.ProjectNotAtFeedbackStep,
        },
      ),
    );

    expect(
      screen.queryByRole("button", { name: /Hand over/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(content.empty.readOnlyDescription),
    ).toBeInTheDocument();
    expect(screen.queryByText(/comes later/)).not.toBeInTheDocument();
  });

  it("says why a round cannot be handed over", () => {
    renderSection(
      viewModel(
        {},
        {
          canHandOver: false,
          handOverBlocker: FeedbackHandOverBlocker.ProjectNotAtFeedbackStep,
        },
      ),
    );

    expect(
      screen.getByText(
        "Round 1 comes later in the process track. Set the current step to the step right before it.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Hand over/ }),
    ).not.toBeInTheDocument();
  });

  it("opens a round through the URL", () => {
    renderSection(viewModel({}, { rounds: [SUMMARY], canHandOver: false }));

    fireEvent.click(
      screen.getByRole("button", { name: "Open feedback round 1" }),
    );

    expect(navigation.replace).toHaveBeenCalledWith(
      "/en/crm?cockpit=customer-1&project=project-1&feedbackRound=round-1",
      { scroll: false },
    );
  });

  it("shows a submitted round with the customer's text as plain text", () => {
    renderSection(
      viewModel({ detail: DETAIL }, { rounds: [SUMMARY], canHandOver: false }),
    );

    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
    expect(screen.getByText(/Submitted by Anna/)).toBeInTheDocument();
  });

  it.each([
    { positions: [1, 2], next: false },
    { positions: [1, 1], next: true },
  ])(
    "offers direct handover only for adjacent rounds: $positions",
    async ({ positions, next }) => {
      const round: FeedbackRoundDto = {
        ...DETAIL,
        status: FeedbackRoundStatus.InProgress,
        items: [
          { ...DETAIL.items[0]!, result: FeedbackItemResult.Implemented },
        ],
      };
      vi.mocked(feedbackRoundsApiService.changeStatus).mockResolvedValue({
        ok: true,
        value: { ...round, status: FeedbackRoundStatus.Completed },
      });
      renderSection(
        viewModel(
          { detail: round, feedbackRoundPositions: positions },
          { rounds: [SUMMARY], canHandOver: false },
        ),
      );

      fireEvent.click(screen.getByRole("button", { name: "Complete round" }));
      fireEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "Complete round",
        }),
      );
      await waitFor(() =>
        expect(
          screen.getByText("Feedback round 1 is completed"),
        ).toBeInTheDocument(),
      );
      if (next) {
        expect(
          screen.getByRole("button", { name: "Hand over round 2" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Later" }),
        ).toBeInTheDocument();
      } else {
        expect(
          screen.getByText(/Continue with “Development”/),
        ).toBeInTheDocument();
        expect(
          within(screen.getByRole("dialog")).getAllByRole("button", {
            name: "Close",
          }),
        ).toHaveLength(2);
        expect(
          screen.queryByRole("button", { name: "Hand over round 2" }),
        ).not.toBeInTheDocument();
      }
    },
  );
});
