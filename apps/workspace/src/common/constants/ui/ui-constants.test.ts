import { describe, expect, it } from "vitest";

import { DialogMessageRole } from "@/common/constants/ui/dialog-message-roles";
import {
  DIALOG_MESSAGE_TONE_VALUES,
  DialogMessageTone,
} from "@/common/constants/ui/dialog-message-tones";
import { WorkspaceDialogSize } from "@/common/constants/ui/workspace-dialog-sizes";

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

describe("WorkspaceDialogSize", () => {
  it("contains the exact sizes without duplicates", () => {
    expect(WorkspaceDialogSize).toEqual({ Narrow: "narrow", Wide: "wide" });
    const values = Object.values(WorkspaceDialogSize);
    expect(new Set(values).size).toBe(values.length);
  });
});
