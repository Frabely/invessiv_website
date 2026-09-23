// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TASK_ACTION_SIDE_VALUES } from "@invessiv/common/constants/crm/task-action-sides";
import { TASK_ACTION_SIDE_BADGE_TONES } from "@/common/constants/crm/badges/task-action-side-badge-tones";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { TaskActionSideBadge } from "./task-action-side-badge";

const content = getCrmTasksDictionary("en");

describe("TaskActionSideBadge", () => {
  afterEach(cleanup);

  it.each(TASK_ACTION_SIDE_VALUES)(
    "renders %s with its assigned tone",
    (side) => {
      render(<TaskActionSideBadge actionSide={side} content={content} />);

      expect(
        screen.getByText(content.actionSide[side]).closest("[data-tone]"),
      ).toHaveAttribute("data-tone", TASK_ACTION_SIDE_BADGE_TONES[side]);
    },
  );
});
