import { describe, expect, it } from "vitest";
import { TASK_STATUS_VALUES } from "@invessiv/common/constants/crm/task-statuses";

import { TASK_STATUS_ICONS } from "./task-status-icons";

describe("TASK_STATUS_ICONS", () => {
  it("covers every task status exactly once", () => {
    expect(Object.keys(TASK_STATUS_ICONS)).toEqual(TASK_STATUS_VALUES);
    expect(new Set(Object.values(TASK_STATUS_ICONS)).size).toBe(
      TASK_STATUS_VALUES.length,
    );
  });
});
