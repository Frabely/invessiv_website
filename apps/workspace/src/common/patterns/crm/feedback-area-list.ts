import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FeedbackAreaRejection } from "@/common/constants/crm/forms/feedback-area-rejections";

/** The server trims and rejects duplicates, empty and overlong areas; the chips follow the same rules. */
export function addFeedbackArea(
  areas: readonly string[],
  candidate: string,
):
  | { ok: true; areas: string[] }
  | { ok: false; rejection: FeedbackAreaRejection } {
  const area = candidate.trim();
  if (!area) return { ok: false, rejection: FeedbackAreaRejection.Empty };
  if (area.length > FEEDBACK_LIMITS.areaLabelMaxLength)
    return { ok: false, rejection: FeedbackAreaRejection.TooLong };
  if (areas.includes(area))
    return { ok: false, rejection: FeedbackAreaRejection.Duplicate };
  if (areas.length >= FEEDBACK_LIMITS.areasPerProject)
    return { ok: false, rejection: FeedbackAreaRejection.LimitReached };
  return { ok: true, areas: [...areas, area] };
}
