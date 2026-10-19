import type { FeedbackRoundErrorCode as E } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import type { FeedbackItemCommandResult } from "./feedback-item-command-result";
export type CloseFeedbackItemClarificationResult = FeedbackItemCommandResult<
  | {
      ok: false;
      code: typeof E.ClarificationNotOpen;
      item: FeedbackRoundItemDto;
    }
  | {
      ok: false;
      code:
        | typeof E.ItemNotFound
        | typeof E.RoundLocked
        | typeof E.CommandIdReused
        | typeof E.ClarificationNotFound;
    }
>;
