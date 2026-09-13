export const ActorType = {
  System: "system",
  User: "user",
  Customer: "customer",
} as const;

export type ActorType = (typeof ActorType)[keyof typeof ActorType];

export const LEGACY_LEAD_ACTOR_TYPE_VALUES = [
  ActorType.System,
  ActorType.User,
] as const;

export type LegacyLeadActorType =
  (typeof LEGACY_LEAD_ACTOR_TYPE_VALUES)[number];

export const ACTOR_TYPE_VALUES = [
  ...LEGACY_LEAD_ACTOR_TYPE_VALUES,
  ActorType.Customer,
] as const;
