import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";

function mapActorToColumns(actor: ActivityActor) {
  switch (actor.type) {
    case ActorType.User:
      return {
        actor_type: actor.type,
        actor_user_id: actor.userId,
        system_actor_key: null,
      };
    case ActorType.System:
      return {
        actor_type: actor.type,
        actor_user_id: null,
        system_actor_key: actor.systemActorKey,
      };
  }
}

export const activityActorMappingService = {
  mapActorToColumns,
} as const;
