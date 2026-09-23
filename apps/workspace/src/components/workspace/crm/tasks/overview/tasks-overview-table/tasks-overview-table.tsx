"use client";

import { DataTableLayout, type ListPaginationProps } from "@invessiv/ui";
import type { TaskListResult } from "@/common/contracts/crm/task-list-result";
import type { TaskAssigneeOption } from "@/common/contracts/crm/tasks-view-model";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { WorkspaceScrollableTableArea } from "@/components/workspace/shared/workspace-scrollable-table-area/workspace-scrollable-table-area";
import type { Locale } from "@/config/i18n";
import { useTaskStatusChange } from "@/hooks/workspace/use-task-status-change";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { TaskOverviewRow } from "../task-overview-row/task-overview-row";

type TasksOverviewTableProps = {
  basePath: string;
  content: CrmTasksDictionary;
  /** The CRM page that opens a customer file; the page owns the route. */
  crmPath?: string;
  list: TaskListResult;
  locale: Locale;
  /** Empty when the actor may not list members; the assignee column then shows a dash. */
  members: readonly TaskAssigneeOption[];
  queryString: string;
  today: string;
  /** Projects whose tasks the actor may change; the status control only exists for these. */
  writableProjectIds: readonly string[];
};

export function TasksOverviewTable({
  basePath,
  content,
  crmPath,
  list,
  locale,
  members,
  queryString,
  today,
  writableProjectIds,
}: TasksOverviewTableProps) {
  const overview = content.overview;
  const statusChange = useTaskStatusChange(content);
  const writableIds = new Set(writableProjectIds);
  const memberNames = new Map(
    members.map((member) => [member.id, member.displayName]),
  );

  const pagination: ListPaginationProps = {
    basePath,
    content: overview.pagination,
    currentPage: list.page,
    perPage: list.perPage,
    queryString,
    total: list.total,
  };
  const columns = [
    { header: overview.columns.due, id: "due", width: 170 },
    { header: overview.columns.task, id: "task", width: 320 },
    { header: overview.columns.status, id: "status", width: 190 },
    { header: overview.columns.side, id: "side", width: 170 },
    { header: overview.columns.assignee, id: "assignee", width: 160 },
    { header: overview.columns.customer, id: "customer", width: 190 },
    { header: overview.columns.project, id: "project", width: 190 },
    { header: overview.columns.visibility, id: "visibility", width: 160 },
  ];

  return (
    <>
      <WorkspaceScrollableTableArea>
        <DataTableLayout
          ariaLabel={overview.caption}
          caption={overview.caption}
          columns={columns}
          fillAvailableHeight
          pagination={pagination}
          responsiveMode="cards"
        >
          {list.rows.map((row) => (
            <TaskOverviewRow
              assigneeName={memberNames.get(row.task.assigneeMemberId) ?? null}
              canWrite={writableIds.has(row.task.projectId)}
              content={content}
              customerHref={
                crmPath
                  ? buildCustomerCockpitHref(crmPath, row.customerId)
                  : null
              }
              key={row.task.id}
              locale={locale}
              onStatusChangeAction={(target, status) =>
                statusChange.changeStatus(target.task, status)
              }
              pending={statusChange.isPending(row.task.id)}
              row={row}
              status={statusChange.statusOf(row.task)}
              today={today}
            />
          ))}
        </DataTableLayout>
      </WorkspaceScrollableTableArea>
      <p aria-live="polite" className="sr-only" role="status">
        {statusChange.announcement}
      </p>
    </>
  );
}
