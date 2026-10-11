import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { HoursViewModel } from "@/common/contracts/crm/hours/hours-view-model";
import { canOn } from "@/common/patterns/auth/can-on";
import { businessToday } from "@/common/patterns/time/business-today";
import { getCustomerHours } from "@/server/workspace/crm/query-handler/get-customer-hours.query-handler";
import { getTaskBookedMinutes } from "@/server/workspace/crm/query-handler/get-task-booked-minutes.query-handler";

/**
 * Loads the hours of one customer for the cockpit. Returns null when the actor reads hours
 * nowhere on this customer — the area then does not exist, not even as an empty section.
 */
export async function buildHoursViewModel(options: {
  actor: WorkspaceActor;
  customerId: string;
}): Promise<HoursViewModel | null> {
  const { actor, customerId } = options;
  const [hours, bookedMinutesByTaskId] = await Promise.all([
    getCustomerHours(customerId, actor),
    getTaskBookedMinutes(customerId, actor),
  ]);
  if (!hours) return null;

  return {
    hours,
    canManage: canOn(actor, Permission.HoursManage, { customerId }),
    writableProjectIds: hours.projects
      .filter((project) =>
        canOn(actor, Permission.HoursWrite, {
          customerId,
          projectId: project.projectId,
        }),
      )
      .map((project) => project.projectId),
    bookedMinutesByTaskId,
    today: businessToday(),
  };
}
