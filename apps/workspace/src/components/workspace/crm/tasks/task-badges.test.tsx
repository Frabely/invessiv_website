// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TASK_ACTION_SIDE_VALUES } from "@invessiv/common/constants/crm/task-action-sides";
import { TASK_ACTION_SIDE_BADGE_TONES } from "@/common/constants/crm/badges/task-action-side-badge-tones";
import { TASK_STATUS_BADGE_TONES } from "@/common/constants/crm/badges/task-status-badge-tones";
import { TASK_LIST_STATUS_FILTER_VALUES } from "@/common/constants/crm/list/task-list-status-filters";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { TaskActionSideBadge } from "./task-action-side-badge/task-action-side-badge";
import { TaskStatusBadge } from "./task-status-badge/task-status-badge";

const content = getCrmTasksDictionary("en");

function toneOf(label: string) {
  return screen.getByText(label).closest("[data-tone]");
}

describe("task badges", () => {
  afterEach(cleanup);

  it.each(TASK_LIST_STATUS_FILTER_VALUES)(
    "renders the %s status with its label and tone",
    (status) => {
      const label = content.overview.toolbar.status.options[status];

      render(<TaskStatusBadge label={label} status={status} />);

      expect(toneOf(label)).toHaveAttribute(
        "data-tone",
        TASK_STATUS_BADGE_TONES[status],
      );
    },
  );

  it.each(TASK_ACTION_SIDE_VALUES)(
    "renders the %s side with its label and tone",
    (side) => {
      render(<TaskActionSideBadge actionSide={side} content={content} />);

      expect(toneOf(content.actionSide[side])).toHaveAttribute(
        "data-tone",
        TASK_ACTION_SIDE_BADGE_TONES[side],
      );
    },
  );
});
