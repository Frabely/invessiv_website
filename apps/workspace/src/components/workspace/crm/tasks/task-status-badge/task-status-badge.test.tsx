// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TASK_LIST_STATUS_FILTER_VALUES } from "@/common/constants/crm/list/task-list-status-filters";
import { TASK_STATUS_BADGE_TONES } from "@/common/constants/crm/badges/task-status-badge-tones";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { TaskStatusBadge } from "./task-status-badge";

const content = getCrmTasksDictionary("en");

describe("TaskStatusBadge", () => {
  afterEach(cleanup);

  it.each(TASK_LIST_STATUS_FILTER_VALUES)(
    "renders %s with its assigned tone",
    (status) => {
      const label = content.overview.toolbar.status.options[status];
      render(<TaskStatusBadge label={label} status={status} />);

      expect(screen.getByText(label).closest("[data-tone]")).toHaveAttribute(
        "data-tone",
        TASK_STATUS_BADGE_TONES[status],
      );
    },
  );
});
