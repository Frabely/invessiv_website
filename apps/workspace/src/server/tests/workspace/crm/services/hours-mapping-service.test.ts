import { describe, expect, it } from "vitest";

import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { hoursMappingService } from "@/server/workspace/crm/services/hours/hours-mapping-service";

const CREATED_AT = new Date("2026-10-08T10:00:00.000Z");

describe("hoursMappingService", () => {
  it("maps project sums to figures and identity, keeping an overdraw visible", () => {
    expect(
      hoursMappingService.toCustomerProjectDto({
        projectId: "project-id",
        title: "Relaunch",
        status: ProjectStatus.Completed,
        allocatedMinutes: 60,
        usedMinutes: 90,
        goodwillMinutes: 30,
      }),
    ).toEqual({
      projectId: "project-id",
      title: "Relaunch",
      status: ProjectStatus.Completed,
      allocatedMinutes: 60,
      usedMinutes: 90,
      goodwillMinutes: 30,
      remainingMinutes: -30,
      releasableMinutes: 0,
    });
  });
  it("maps a purchase row to its DTO without the internal columns", () => {
    expect(
      hoursMappingService.toPurchaseDto({
        id: "purchase-id",
        customer_id: "customer-id",
        kind: HourPurchaseKind.Correction,
        source: HourPurchaseSource.Manual,
        minutes: -60,
        purchased_on: "2026-10-08",
        note: "",
        idempotency_key: "key",
        created_by_member_id: "member-id",
        created_at: CREATED_AT,
      }),
    ).toEqual({
      id: "purchase-id",
      kind: "correction",
      source: "manual",
      minutes: -60,
      purchasedOn: "2026-10-08",
      note: "",
      createdByMemberId: "member-id",
      createdAt: "2026-10-08T10:00:00.000Z",
    });
  });

  it("maps an allocation row to its DTO without the internal columns", () => {
    expect(
      hoursMappingService.toAllocationDto({
        id: "allocation-id",
        customer_id: "customer-id",
        project_id: "project-id",
        minutes: 300,
        note: "Relaunch",
        idempotency_key: "key",
        created_by_member_id: "member-id",
        created_at: CREATED_AT,
      }),
    ).toEqual({
      id: "allocation-id",
      projectId: "project-id",
      minutes: 300,
      note: "Relaunch",
      createdByMemberId: "member-id",
      createdAt: "2026-10-08T10:00:00.000Z",
    });
  });
});
