import { describe, expect, it } from "vitest";

import { workspaceMemberOptionMappingService } from "@/server/workspace/access/services/workspace-member-option-mapping-service";

describe("workspaceMemberOptionMappingService.mapRowsToOptions", () => {
  it("maps id and display name only and keeps the query order", () => {
    expect(
      workspaceMemberOptionMappingService.mapRowsToOptions([
        { member_id: "member-b", display_name: "Anna" },
        { member_id: "member-a", display_name: "Ben" },
      ]),
    ).toEqual([
      { id: "member-b", displayName: "Anna" },
      { id: "member-a", displayName: "Ben" },
    ]);
  });

  it("returns an empty list without members", () => {
    expect(workspaceMemberOptionMappingService.mapRowsToOptions([])).toEqual(
      [],
    );
  });
});
