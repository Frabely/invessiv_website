import { describe, expect, it } from "vitest";

import { BADGE_TONE_VALUES } from "@invessiv/common/constants/ui/badge-tones";
import { TASK_ACTION_SIDE_VALUES } from "@invessiv/common/constants/crm/task-action-sides";
import { TASK_STATUS_VALUES } from "@invessiv/common/constants/crm/task-statuses";
import { TASK_ACTION_SIDE_BADGE_TONES } from "@/common/constants/crm/badges/task-action-side-badge-tones";
import { TASK_STATUS_BADGE_TONES } from "@/common/constants/crm/badges/task-status-badge-tones";
import { TASK_LIST_STATUS_FILTER_VALUES } from "@/common/constants/crm/list/task-list-status-filters";

const KNOWN_TONES: readonly string[] = BADGE_TONE_VALUES;

describe("task badge tones", () => {
  it("gives every status filter and side a known tone", () => {
    for (const value of TASK_LIST_STATUS_FILTER_VALUES) {
      expect(KNOWN_TONES).toContain(TASK_STATUS_BADGE_TONES[value]);
    }
    for (const value of TASK_ACTION_SIDE_VALUES) {
      expect(KNOWN_TONES).toContain(TASK_ACTION_SIDE_BADGE_TONES[value]);
    }
  });

  it("covers every task status, so a task's own status is colored like its filter", () => {
    for (const status of TASK_STATUS_VALUES) {
      expect(TASK_STATUS_BADGE_TONES[status]).toBeDefined();
    }
  });

  it("keeps the all options neutral and gives states that need attention a distinct tone", () => {
    expect(TASK_STATUS_BADGE_TONES.all).toBe("neutral");
    expect(TASK_STATUS_BADGE_TONES.done).toBe("success");
    expect(TASK_ACTION_SIDE_BADGE_TONES.customer).toBe("warning");
  });

  it("uses a different tone for each open-work status", () => {
    const tones = [
      TASK_STATUS_BADGE_TONES.open,
      TASK_STATUS_BADGE_TONES.in_progress,
      TASK_STATUS_BADGE_TONES.done,
    ];

    expect(new Set(tones).size).toBe(tones.length);
  });
});
