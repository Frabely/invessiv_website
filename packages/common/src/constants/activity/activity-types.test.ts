import { describe, expect, it } from "vitest";

import {
  ACTIVITY_TYPE_VALUES,
  ActivityType,
  LEGACY_LEAD_ACTIVITY_TYPE_VALUES,
} from "@invessiv/common/constants/activity/activity-types";

describe("ActivityType", () => {
  it("contains the exact supported values", () => {
    expect(ACTIVITY_TYPE_VALUES).toEqual([
      "note",
      "status_change",
      "inbound_submission",
      "import",
      "bulk_edit",
      "message_drafted",
      "created",
      "field_change",
      "converted_from_lead",
      "credential_revealed",
      "file_uploaded",
      "submission_received",
      "phase_change",
      "renewal_renewed",
      "mail_sent",
    ]);
    expect(ACTIVITY_TYPE_VALUES).toEqual(Object.values(ActivityType));
  });

  it("keeps the persisted legacy lead activity strings unchanged", () => {
    expect(LEGACY_LEAD_ACTIVITY_TYPE_VALUES).toEqual([
      "note",
      "status_change",
      "inbound_submission",
      "import",
      "bulk_edit",
      "message_drafted",
    ]);
  });

  it("preserves every legacy lead activity value", () => {
    expect(
      LEGACY_LEAD_ACTIVITY_TYPE_VALUES.every((value) =>
        ACTIVITY_TYPE_VALUES.includes(value),
      ),
    ).toBe(true);
  });

  it("has no duplicates", () => {
    expect(new Set(ACTIVITY_TYPE_VALUES).size).toBe(
      ACTIVITY_TYPE_VALUES.length,
    );
  });
});
