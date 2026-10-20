import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { PortalProjectFeedbackDto } from "@invessiv/common/contracts/portal/portal-project-feedback.dto";

export function portalFeedbackRound(
  overrides: Partial<PortalFeedbackRoundDto> = {},
) {
  return {
    id: "round-1",
    roundNumber: 1,
    status: FeedbackRoundStatus.Open,
    previewUrl: "https://preview.example.test",
    handoverNote: "First complete version",
    dueOn: "2026-10-14",
    areaOptions: ["Home", "Contact"],
    draftUpdatedAt: null,
    draftUpdatedByName: null,
    submittedAt: null,
    customerNotice: null,
    completedAt: null,
    approvedAt: null,
    items: [],
    version: 1,
    ...overrides,
  } satisfies PortalFeedbackRoundDto;
}

export function portalProjectFeedback(
  overrides: Partial<PortalProjectFeedbackDto> = {},
): PortalProjectFeedbackDto {
  return {
    projectId: "project-1",
    projectTitle: "Relaunch",
    quota: {
      included: 2,
      used: 1,
      remaining: 1,
      activeRoundNumber: 1,
      approvedRoundNumber: null,
    },
    activeRound: portalFeedbackRound(),
    history: [],
    canSubmit: true,
    canAttach: false,
    contact: null,
    ...overrides,
  };
}
