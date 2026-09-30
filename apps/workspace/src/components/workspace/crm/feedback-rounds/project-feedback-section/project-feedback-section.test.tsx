// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackHandOverBlocker } from "@invessiv/common/constants/crm/feedback-hand-over-blockers";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import type { FeedbackRoundSummaryDto } from "@invessiv/common/contracts/crm/feedback-round-summary.dto";
import type { FeedbackRoundsViewModel } from "@/common/contracts/crm/feedback-rounds-view-model";
import {
  getCrmFeedbackRoundsDictionary,
  getCrmFilesDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { ProjectFeedbackSection } from "./project-feedback-section";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/en/crm",
  useSearchParams: () => new URLSearchParams("cockpit=customer-1"),
}));

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
    ...overrides,
  };
}

function renderSection(model: FeedbackRoundsViewModel) {
  return render(
    <ProjectFeedbackSection
      content={content}
      customerId="customer-1"
      filesContent={filesContent}
      locale="en"
      viewModel={model}
    />,
  );
}

describe("ProjectFeedbackSection", () => {
  beforeEach(() => navigation.replace.mockReset());
  afterEach(cleanup);

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
});
