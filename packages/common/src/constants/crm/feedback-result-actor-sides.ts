export const FeedbackResultActorSide = {
  Member: "member",
  PortalContact: "portal_contact",
} as const;

export type FeedbackResultActorSide =
  (typeof FeedbackResultActorSide)[keyof typeof FeedbackResultActorSide];

export const FEEDBACK_RESULT_ACTOR_SIDE_VALUES = [
  FeedbackResultActorSide.Member,
  FeedbackResultActorSide.PortalContact,
] as const;
