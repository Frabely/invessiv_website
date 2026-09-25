import { describe, expect, it } from "vitest";
import { portalAccessMappingService } from "@/server/workspace/crm/services/portal-access/portal-access-mapping-service";

describe("portalAccessMappingService", () => {
  it("groups invitation and membership role rows into portal access DTOs", () => {
    const access = portalAccessMappingService.mapRowsToDto({
      customerId: "customer-a",
      customerVersion: 2,
      previewConfirmedAt: null,
      asOf: new Date("2026-01-09"),
      contacts: [{ id: "assignment-a", displayName: "Contact A" }],
      roles: [
        {
          id: "role-a",
          name: "Standard",
          systemKey: "portal_standard",
          active: true,
          permission: "portal.access",
        },
      ],
      invitations: [
        {
          id: "invitation-a",
          assignmentId: "assignment-a",
          roleId: "role-a",
          createdAt: new Date("2026-01-01"),
          expiresAt: new Date("2026-01-08"),
        },
      ],
      memberships: [
        {
          id: "membership-a",
          assignmentId: "assignment-a",
          version: 3,
          roleId: "role-a",
          activatedAt: new Date("2026-01-01"),
          lastSeenAt: null,
          emailNotificationsEnabled: true,
        },
      ],
    });
    expect(access.customerId).toBe("customer-a");
    expect(access.previewConfirmedAt).toBeNull();
    expect(access.invitations[0].roleIds).toEqual(["role-a"]);
    expect(access.invitations[0].expired).toBe(true);
    expect(access.memberships[0]).toMatchObject({
      roleIds: ["role-a"],
      lastSeenAt: null,
      emailNotificationsEnabled: true,
    });
  });
});
