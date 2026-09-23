import { describe, expect, it } from "vitest";

import {
  TASKS_EMPTY_STATE_VARIANT_VALUES,
  TasksEmptyStateVariant,
} from "@/common/constants/crm/list/tasks-empty-state-variants";

describe("TasksEmptyStateVariant", () => {
  it("contains the exact variants without duplicates", () => {
    expect(TASKS_EMPTY_STATE_VARIANT_VALUES).toEqual([
      "empty",
      "no_results",
      "nothing_overdue",
    ]);
    expect(TASKS_EMPTY_STATE_VARIANT_VALUES).toEqual(
      Object.values(TasksEmptyStateVariant),
    );
    expect(new Set(TASKS_EMPTY_STATE_VARIANT_VALUES).size).toBe(
      TASKS_EMPTY_STATE_VARIANT_VALUES.length,
    );
  });
});
