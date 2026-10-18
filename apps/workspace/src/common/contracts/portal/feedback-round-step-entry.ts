import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { FeedbackRoundStepKind } from "@/common/constants/portal/feedback-round-step-kinds";

/** One step of the portal feedback track: a handed-over round, or one still to come or expired. */
export type FeedbackRoundStepEntry =
  | {
      kind: typeof FeedbackRoundStepKind.Round;
      roundNumber: number;
      round: PortalFeedbackRoundDto;
    }
  | {
      kind:
        | typeof FeedbackRoundStepKind.Upcoming
        | typeof FeedbackRoundStepKind.Expired;
      roundNumber: number;
      round: null;
    };
