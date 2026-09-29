import { FeedbackRoundStatus } from "./feedback-round-statuses";
import { FeedbackTransitionSide } from "./feedback-transition-sides";

/**
 * The only source for allowed status changes, read by the server and by the UI. `from: null` is the
 * handover, which creates the round. Conditions and side effects per entry are documented in
 * `plans/crm/16-feedbackrunden/58-datenmodell-und-fundament.md`.
 */
export const FEEDBACK_ROUND_TRANSITIONS = [
  {
    from: null,
    to: FeedbackRoundStatus.Open,
    side: FeedbackTransitionSide.Internal,
  },
  {
    from: FeedbackRoundStatus.Open,
    to: FeedbackRoundStatus.Submitted,
    side: FeedbackTransitionSide.Customer,
  },
  {
    from: FeedbackRoundStatus.Open,
    to: FeedbackRoundStatus.Approved,
    side: FeedbackTransitionSide.Customer,
  },
  {
    from: FeedbackRoundStatus.Submitted,
    to: FeedbackRoundStatus.InDiscussion,
    side: FeedbackTransitionSide.Internal,
  },
  {
    from: FeedbackRoundStatus.Submitted,
    to: FeedbackRoundStatus.InProgress,
    side: FeedbackTransitionSide.Internal,
  },
  {
    from: FeedbackRoundStatus.InDiscussion,
    to: FeedbackRoundStatus.InProgress,
    side: FeedbackTransitionSide.Internal,
  },
  {
    from: FeedbackRoundStatus.Submitted,
    to: FeedbackRoundStatus.Open,
    side: FeedbackTransitionSide.Internal,
  },
  {
    from: FeedbackRoundStatus.InDiscussion,
    to: FeedbackRoundStatus.Open,
    side: FeedbackTransitionSide.Internal,
  },
  {
    from: FeedbackRoundStatus.InProgress,
    to: FeedbackRoundStatus.Completed,
    side: FeedbackTransitionSide.Internal,
  },
  {
    from: FeedbackRoundStatus.Completed,
    to: FeedbackRoundStatus.Approved,
    side: FeedbackTransitionSide.Customer,
  },
] as const;
