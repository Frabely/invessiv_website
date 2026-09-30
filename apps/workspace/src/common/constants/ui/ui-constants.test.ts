import { describe, expect, it } from "vitest";

import { DialogMessageRole } from "@/common/constants/ui/dialog-message-roles";
import {
  STATUS_ROW_TONE_VALUES,
  StatusRowTone,
} from "@/common/constants/ui/status-row-tones";
import {
  DIALOG_MESSAGE_TONE_VALUES,
  DialogMessageTone,
} from "@/common/constants/ui/dialog-message-tones";

describe("DialogMessageTone", () => {
  it("contains the exact tones without duplicates", () => {
    expect(DIALOG_MESSAGE_TONE_VALUES).toEqual(["info", "conflict", "error"]);
    expect([...DIALOG_MESSAGE_TONE_VALUES]).toEqual(
      Object.values(DialogMessageTone),
    );
    expect(new Set(DIALOG_MESSAGE_TONE_VALUES).size).toBe(
      DIALOG_MESSAGE_TONE_VALUES.length,
    );
  });
});

describe("DialogMessageRole", () => {
  it("contains the exact ARIA live roles without duplicates", () => {
    expect(DialogMessageRole).toEqual({ Status: "status", Alert: "alert" });
    const values = Object.values(DialogMessageRole);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("StatusRowTone", () => {
  it("contains the exact tones without duplicates", () => {
    expect(STATUS_ROW_TONE_VALUES).toEqual(["default", "attention", "muted"]);
    expect([...STATUS_ROW_TONE_VALUES]).toEqual(Object.values(StatusRowTone));
    expect(new Set(STATUS_ROW_TONE_VALUES).size).toBe(
      STATUS_ROW_TONE_VALUES.length,
    );
  });
});
