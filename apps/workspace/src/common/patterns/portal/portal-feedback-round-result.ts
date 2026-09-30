import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackRoundClientResult } from "@/common/contracts/portal/portal-feedback-client-result";
import { PortalFeedbackRoundResultKind } from "@/common/constants/portal/portal-feedback-round-result-kinds";

/** Gives submit and approval the same result categories while leaving UI reactions to each caller. */
export function portalFeedbackRoundResult(
  result: PortalFeedbackRoundClientResult,
) {
  if (result.ok)
    return {
      kind: PortalFeedbackRoundResultKind.Success,
      round: result.round,
    } as const;
  if (result.code === ConcurrencyErrorCode.VersionConflict)
    return {
      kind: PortalFeedbackRoundResultKind.Conflict,
      current: result.current,
    } as const;
  if (result.code === PortalFeedbackErrorCode.ItemTextRequired)
    return {
      kind: PortalFeedbackRoundResultKind.ItemTextRequired,
      itemIds: result.itemIds,
    } as const;
  if (result.code === PortalFeedbackErrorCode.Locked)
    return { kind: PortalFeedbackRoundResultKind.Locked } as const;
  return {
    kind: PortalFeedbackRoundResultKind.Error,
    code: result.code,
  } as const;
}
