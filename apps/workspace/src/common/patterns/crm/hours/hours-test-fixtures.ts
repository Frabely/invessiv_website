import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import type { CustomerHoursProjectDto } from "@invessiv/common/contracts/crm/hours/customer-hours-project.dto";
import type { HoursViewModel } from "@/common/contracts/crm/hours/hours-view-model";

export function project(
  overrides: Partial<CustomerHoursProjectDto> = {},
): CustomerHoursProjectDto {
  return {
    projectId: "33333333-3333-4333-8333-333333333333",
    title: "Relaunch",
    status: ProjectStatus.Active,
    allocatedMinutes: 300,
    usedMinutes: 150,
    goodwillMinutes: 0,
    remainingMinutes: 150,
    releasableMinutes: 150,
    ...overrides,
  };
}

export function viewModel(
  overrides: Partial<HoursViewModel> = {},
): HoursViewModel {
  return {
    canManage: true,
    writableProjectIds: [],
    bookedMinutesByTaskId: {},
    today: "2026-10-08",
    hours: {
      balance: {
        purchasedMinutes: 600,
        allocatedMinutes: 300,
        freeMinutes: 300,
        usedMinutes: 150,
        goodwillMinutes: 0,
        remainingMinutes: 450,
      },
      projects: [project()],
      purchases: [
        {
          id: "purchase-1",
          kind: HourPurchaseKind.Purchase,
          source: HourPurchaseSource.Manual,
          minutes: 600,
          purchasedOn: "2026-10-01",
          note: "Betreuungspaket 10 h",
          createdByMemberId: "member-1",
          createdAt: "2026-10-01T08:00:00.000Z",
        },
      ],
      allocations: [],
    },
    ...overrides,
  };
}
