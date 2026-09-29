import type { PortalFeedbackRoundDto } from "./portal-feedback-round.dto";

/** Answer of a submission; a repeated submit by the same contact is a success, not an error. */
export interface SubmitPortalFeedbackRoundResponseDto {
  /** True when this contact had already submitted the round; nothing was written again. */
  alreadySubmitted: boolean;
  /** The round as it is now. */
  round: PortalFeedbackRoundDto;
}
