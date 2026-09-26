import type { ActorType } from "@invessiv/common/constants/activity/actor-types";
import type { SystemActorKey } from "@invessiv/common/constants/activity/system-actor-keys";

/**
 * Who caused an activity or security event. A human is always a `users` row — whether they are
 * owner or member follows from memberships and roles, not from here. `customer` marks a write
 * made through a portal membership, so the timeline can tell customer actions apart.
 */
export type ActivityActor =
  | { type: typeof ActorType.User; userId: string }
  | { type: typeof ActorType.Customer; userId: string }
  | { type: typeof ActorType.System; systemActorKey: SystemActorKey };
