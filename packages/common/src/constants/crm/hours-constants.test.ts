import { describe, expect, it } from "vitest";

import {
  HOURS_ERROR_CODE_VALUES,
  HoursErrorCode,
} from "@invessiv/common/constants/crm/errors/hours-error-codes";
import {
  HOUR_PURCHASE_KIND_VALUES,
  HourPurchaseKind,
} from "@invessiv/common/constants/crm/hour-purchase-kinds";
import {
  HOUR_PURCHASE_SOURCE_VALUES,
  HourPurchaseSource,
} from "@invessiv/common/constants/crm/hour-purchase-sources";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";

describe("hours constants", () => {
  it("lists every purchase kind exactly once", () => {
    expect(HOUR_PURCHASE_KIND_VALUES).toEqual(["purchase", "correction"]);
    expect(HOUR_PURCHASE_KIND_VALUES).toEqual(Object.values(HourPurchaseKind));
    expect(new Set(HOUR_PURCHASE_KIND_VALUES).size).toBe(
      HOUR_PURCHASE_KIND_VALUES.length,
    );
  });

  it("lists every purchase source exactly once", () => {
    expect(HOUR_PURCHASE_SOURCE_VALUES).toEqual(["manual"]);
    expect(HOUR_PURCHASE_SOURCE_VALUES).toEqual(
      Object.values(HourPurchaseSource),
    );
  });

  it("lists every error code exactly once", () => {
    expect(HOURS_ERROR_CODE_VALUES).toEqual([
      "CUSTOMER_NOT_FOUND",
      "PROJECT_NOT_FOUND",
      "TIME_ENTRY_NOT_FOUND",
      "PROJECT_CLOSED",
      "INSUFFICIENT_FREE_HOURS",
      "INSUFFICIENT_RELEASABLE_HOURS",
      "BELOW_ALLOCATED_HOURS",
      "TASK_NOT_LINKABLE",
      "VALIDATION_ERROR",
      "INTERNAL",
    ]);
    expect(HOURS_ERROR_CODE_VALUES).toEqual(Object.values(HoursErrorCode));
    expect(new Set(HOURS_ERROR_CODE_VALUES).size).toBe(
      HOURS_ERROR_CODE_VALUES.length,
    );
  });

  it("keeps every limit a multiple of the booking step", () => {
    expect(HoursLimits).toEqual({
      StepMinutes: 15,
      MaxEntryMinutes: 600000,
      MaxLedgerMinutes: 600000,
      NoteMaxLength: 200,
      DescriptionMaxLength: 500,
      HistoryPreviewSize: 20,
    });
    expect(HoursLimits.MaxEntryMinutes % HoursLimits.StepMinutes).toBe(0);
    expect(HoursLimits.MaxLedgerMinutes % HoursLimits.StepMinutes).toBe(0);
  });
});
