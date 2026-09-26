"use client";

import { useRouter } from "next/navigation";
import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { tasksApiService } from "@/client/crm/tasks-api-service";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import { useOptimisticChange } from "@/hooks/use-optimistic-change";

type StatusTask = Pick<TaskDto, "id" | "status" | "title" | "version">;

export function useTaskStatusChange(content: CrmTasksDictionary) {
  const router = useRouter();
  const optimistic = useOptimisticChange<TaskStatus, StatusTask>({
    valueOf: (task) => task.status,
    submit: (task, status) =>
      tasksApiService.changeTaskStatus(task.id, {
        status,
        version: task.version,
      }),
    announce: {
      success: (task, status) =>
        formatMessage(content.announce.statusChanged, {
          name: task.title,
          status: content.status[status].toLowerCase(),
        }),
      failure: (task) =>
        formatMessage(content.announce.statusFailed, { name: task.title }),
    },
    onSettled: () => router.refresh(),
  });

  return {
    announcement: optimistic.announcement,
    changeStatus: optimistic.change,
    isPending: optimistic.isPending,
    statusOf: optimistic.valueOf,
  };
}
