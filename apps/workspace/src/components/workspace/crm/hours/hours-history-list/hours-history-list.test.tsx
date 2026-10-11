// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { HoursViewModel } from "@/common/contracts/crm/hours/hours-view-model";
import {
  project,
  viewModel,
} from "@/common/patterns/crm/hours/hours-test-fixtures";
import { getCrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { HoursHistoryList } from "./hours-history-list";
afterEach(cleanup);
function renderDialog(model: HoursViewModel) {
  return render(
    <HoursHistoryList
      allocations={model.hours.allocations}
      content={getCrmHoursDictionary("de").history}
      locale="de"
      projects={model.hours.projects}
      purchases={model.hours.purchases}
    />,
  );
}
describe("HoursHistoryList", () => {
  it("shows allocation instants on the Berlin calendar day", () => {
    renderDialog(
      viewModel({
        hours: {
          ...viewModel().hours,
          allocations: [
            {
              id: "allocation-1",
              projectId: project().projectId,
              minutes: 60,
              note: "Mitternacht",
              createdByMemberId: "member-1",
              createdAt: "2026-10-10T22:30:00.000Z",
            },
          ],
        },
      }),
    );
    expect(screen.getByText(/11\. Okt/)).toBeVisible();
  });
});
