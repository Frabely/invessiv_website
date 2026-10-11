/** Marks an activity as belonging to a feedback round; the feedback text itself never enters the log. */
export const FEEDBACK_ROUND_ACTIVITY_ENTITY = "feedback_round";

/** The one round field whose change is recorded as a `field_change` activity. */
export const FEEDBACK_ROUND_ACTIVITY_STATUS_FIELD = "status";

/** Marks the activity of a round step that was added to a project's track with a sold service. */
export const FEEDBACK_QUOTA_ACTIVITY_ENTITY = "feedback_quota";

/** The project field whose change that activity records. */
export const FEEDBACK_QUOTA_ACTIVITY_FIELD = "included_feedback_rounds";
