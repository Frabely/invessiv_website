import { describe, expect, it } from "vitest";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { SystemActorKey } from "@invessiv/common/constants/activity/system-actor-keys";
import { activityActorMappingService } from "@/server/workspace/shared/services/activity-actor-mapping-service";

describe("activityActorMappingService.mapActorToColumns", () => {
  it("maps a human actor to its user reference without a system key", () => {
    expect(
      activityActorMappingService.mapActorToColumns({
        type: ActorType.User,
        userId: "user-uuid-1",
      }),
    ).toEqual({
      actor_type: ActorType.User,
      actor_user_id: "user-uuid-1",
      system_actor_key: null,
    });
  });

  it("maps a system actor to its key without a user reference", () => {
    expect(
      activityActorMappingService.mapActorToColumns({
        type: ActorType.System,
        systemActorKey: SystemActorKey.Fixture,
      }),
    ).toEqual({
      actor_type: ActorType.System,
      actor_user_id: null,
      system_actor_key: SystemActorKey.Fixture,
    });
  });
});
