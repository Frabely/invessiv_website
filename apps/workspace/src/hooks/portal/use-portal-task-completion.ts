"use client";

import { useRouter } from "next/navigation";
import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import { portalTasksApiService } from "@/client/portal/portal-tasks-api-service";
import { useOptimisticChange } from "@/hooks/use-optimistic-change";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { formatMessage } from "@/lib/i18n/format-message";

/**
 * Ticks a customer task off right away and rolls back with an announcement when the server
 * refuses. Completing is one-way in the portal, so the only value ever submitted is `true`.
 */
export function usePortalTaskCompletion(
  customerId: string,
  announce: PortalDashboardDictionary["tasks"]["announce"],
) {
  const router = useRouter();
  const optimistic = useOptimisticChange<boolean, PortalCustomerTaskDto>({
    valueOf: (task) => task.done,
    submit: (task) => portalTasksApiService.completeTask(customerId, task.id),
    announce: {
      success: (task) =>
        formatMessage(announce.completed, { name: task.title }),
      failure: (task) => formatMessage(announce.failed, { name: task.title }),
    },
    onSettled: () => router.refresh(),
  });

  return {
    announcement: optimistic.announcement,
    complete: (task: PortalCustomerTaskDto) => optimistic.change(task, true),
    isDone: optimistic.valueOf,
    isPending: optimistic.isPending,
  };
}
