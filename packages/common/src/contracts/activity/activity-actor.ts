import type { ActorType } from "@invessiv/common/constants/activity/actor-types";
import type { SystemActorKey } from "@invessiv/common/constants/activity/system-actor-keys";

/**
 * Who caused an activity or security event. A human is always a `users` row — whether they are
 * owner, member or later a portal contact follows from memberships and roles, not from here.
 */
export type ActivityActor =
  | { type: typeof ActorType.User; userId: string }
  | { type: typeof ActorType.System; systemActorKey: SystemActorKey };
