import { describe, expect, it } from "vitest";

import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HourAllocationDirection } from "@/common/constants/crm/hour-allocation-directions";
import {
  toHourAllocationRequest,
  toHourPurchaseRequest,
} from "@/common/patterns/crm/hours/hours-form-request";

describe("hours form requests", () => {
  it("sends a correction as negative minutes and trims the note", () => {
    const base = {
      idempotencyKey: "key",
      minutes: 60,
      purchasedOn: "2026-10-08",
      note: " Paket ",
    };

    expect(
      toHourPurchaseRequest({ ...base, kind: HourPurchaseKind.Purchase }),
    ).toEqual({ ...base, kind: "purchase", minutes: 60, note: "Paket" });
    expect(
      toHourPurchaseRequest({ ...base, kind: HourPurchaseKind.Correction }),
    ).toMatchObject({ kind: "correction", minutes: -60 });
  });

  it("sends a release as negative minutes", () => {
    const base = {
      idempotencyKey: "key",
      projectId: "project",
      minutes: 45,
      note: "",
    };

    expect(
      toHourAllocationRequest({
        ...base,
        direction: HourAllocationDirection.Allocate,
      }),
    ).toEqual({ ...base, minutes: 45 });
    expect(
      toHourAllocationRequest({
        ...base,
        direction: HourAllocationDirection.Release,
      }).minutes,
    ).toBe(-45);
  });
});
