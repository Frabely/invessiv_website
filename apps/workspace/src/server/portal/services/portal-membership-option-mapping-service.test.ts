import { describe, expect, it, vi } from "vitest";

import type { PortalMembershipOptionRow } from "@invessiv/common/contracts/portal/rows/portal-membership-option-row";
import { portalMembershipOptionMappingService } from "@/server/portal/services/portal-membership-option-mapping-service";

vi.mock("server-only", () => ({}));

describe("portalMembershipOptionMappingService", () => {
  it("maps a membership row to a company picker option", () => {
    const row: PortalMembershipOptionRow = {
      customer_id: "customer-1",
      display_name: "Nordlicht Coaching",
    };

    expect(portalMembershipOptionMappingService.mapMembershipRow(row)).toEqual({
      customerId: "customer-1",
      displayName: "Nordlicht Coaching",
    });
  });
});
