export const SystemActorKey = {
  Fixture: "fixture",
} as const;

export type SystemActorKey =
  (typeof SystemActorKey)[keyof typeof SystemActorKey];

export const SYSTEM_ACTOR_KEY_VALUES = [SystemActorKey.Fixture] as const;
