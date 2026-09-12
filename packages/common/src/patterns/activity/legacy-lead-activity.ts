import {
  type ActivityType,
  LEGACY_LEAD_ACTIVITY_TYPE_VALUES,
  type LegacyLeadActivityType,
} from "@invessiv/common/constants/activity/activity-types";
import {
  type ActorType,
  LEGACY_LEAD_ACTOR_TYPE_VALUES,
  type LegacyLeadActorType,
} from "@invessiv/common/constants/activity/actor-types";

export function isLegacyLeadActivityType(
  type: ActivityType,
): type is LegacyLeadActivityType {
  return LEGACY_LEAD_ACTIVITY_TYPE_VALUES.some((value) => value === type);
}

export function isLegacyLeadActorType(
  actorType: ActorType,
): actorType is LegacyLeadActorType {
  return LEGACY_LEAD_ACTOR_TYPE_VALUES.some((value) => value === actorType);
}
