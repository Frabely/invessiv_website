"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { tasksApiService } from "@/client/crm/tasks-api-service";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";

/**
 * Changes the status of a task from a list row without waiting for the round trip: the picked
 * status shows immediately, is announced to assistive technology once the server confirmed it, and
 * is put back with a message when the change failed.
 *
 * Owns the whole interaction, so a list only renders `statusOf(task)` and calls `changeStatus`;
 * it never duplicates the pending, revert or announcement handling.
 */
export function useTaskStatusChange(content: CrmTasksDictionary) {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState("");
  // The picked status only counts for the version it was picked on; a refresh brings a newer
  // version and the server's answer takes over without any cleanup.
  const [picked, setPicked] = useState<
    Record<string, { baseVersion: number; status: TaskStatus }>
  >({});
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());

  function statusOf(task: Pick<TaskDto, "id" | "status" | "version">) {
    const pick = picked[task.id];
    return pick && pick.baseVersion === task.version
      ? pick.status
      : task.status;
  }

  function setPending(taskId: string, pending: boolean) {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }

  async function changeStatus(
    task: Pick<TaskDto, "id" | "status" | "title" | "version">,
    status: TaskStatus,
  ) {
    if (pendingIds.has(task.id) || status === statusOf(task)) return;

    setPending(task.id, true);
    setPicked((current) => ({
      ...current,
      [task.id]: { baseVersion: task.version, status },
    }));
    const result = await tasksApiService.changeTaskStatus(task.id, {
      status,
      version: task.version,
    });
    setPending(task.id, false);

    if (result.ok) {
      setAnnouncement(
        formatMessage(content.announce.statusChanged, {
          name: task.title,
          status: content.status[status].toLowerCase(),
        }),
      );
      router.refresh();
      return;
    }

    setPicked((current) => {
      const { [task.id]: _reverted, ...rest } = current;
      return rest;
    });
    setAnnouncement(
      formatMessage(content.announce.statusFailed, { name: task.title }),
    );
    // A conflict means the row is stale; a refresh shows what changed in the meantime.
    router.refresh();
  }

  return {
    announcement,
    changeStatus,
    isPending: (taskId: string) => pendingIds.has(taskId),
    setAnnouncement,
    statusOf,
  };
}
