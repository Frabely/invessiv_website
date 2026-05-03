export const LeadActorType = {
  System: "system",
  User: "user",
} as const;

export type LeadActorType = (typeof LeadActorType)[keyof typeof LeadActorType];

export const LEAD_ACTOR_TYPE_VALUES = [
  LeadActorType.System,
  LeadActorType.User,
] as const;
