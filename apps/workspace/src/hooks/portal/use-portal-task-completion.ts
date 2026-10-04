"use client";

import { useRouter } from "next/navigation";
import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import { portalTasksApiService } from "@/client/portal/portal-tasks-api-service";
import { useOptimisticChange } from "@/hooks/use-optimistic-change";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";

/**
 * Ticks a customer task off or takes the tick back right away and rolls back with an announcement
 * when the server refuses. Whether a tick may be taken back is the server's call (`canReopen`);
 * this hook only sends what the list lets through.
 */
export function usePortalTaskCompletion(
  customerId: string,
  announce: PortalDashboardDictionary["tasks"]["announce"],
) {
  const router = useRouter();
  const optimistic = useOptimisticChange<boolean, PortalCustomerTaskDto>({
    valueOf: (task) => task.done,
    submit: (task, done) =>
      done
        ? portalTasksApiService.completeTask(customerId, task.id)
        : portalTasksApiService.reopenTask(customerId, task.id),
    announce: {
      success: (task, done) =>
        formatMessage(done ? announce.completed : announce.reopened, {
          name: task.title,
        }),
      failure: (task) => formatMessage(announce.failed, { name: task.title }),
    },
    onSettled: () => router.refresh(),
  });

  return {
    announcement: optimistic.announcement,
    toggle: (task: PortalCustomerTaskDto, done: boolean) =>
      optimistic.change(task, done),
    isDone: optimistic.valueOf,
    isPending: optimistic.isPending,
  };
}
