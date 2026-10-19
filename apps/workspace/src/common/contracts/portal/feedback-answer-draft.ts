import type { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { FeedbackAnswerProblem } from "@/common/constants/portal/feedback-answer-problems";

/** One typed answer in the portal, bound to the question it was written for. */
export type FeedbackAnswerDraft = {
  itemId: string;
  clarificationId: string;
  text: string;
  /** Kept for a retry of the same text; renewed with every change and after a conflict. */
  commandId: string;
  busy: boolean;
  /** The question is no longer open: the text stays readable but can neither change nor be sent. */
  locked: boolean;
  problem: FeedbackAnswerProblem | null;
  /** Server code behind a `failure`, so the portal can word it. */
  code: PortalFeedbackErrorCode | null;
};
