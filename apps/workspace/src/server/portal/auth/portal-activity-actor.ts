import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { PortalActor } from "./portal-actor";

type CustomerActivityActor = Extract<
  ActivityActor,
  { type: typeof ActorType.Customer }
>;

/** Activities name the contact by user id only, never by membership, name or e-mail. */
export function portalActivityActor(actor: PortalActor): CustomerActivityActor {
  return { type: ActorType.Customer, userId: actor.userId };
}
