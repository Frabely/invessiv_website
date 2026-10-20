import type { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import type { VersionedJsonMutationResult } from "@/common/contracts/client/versioned-json-mutation-result";

export type FeedbackItemClientResult = VersionedJsonMutationResult<
  FeedbackRoundItemDto,
  FeedbackRoundErrorCode,
  FeedbackRoundErrorCode
>;
