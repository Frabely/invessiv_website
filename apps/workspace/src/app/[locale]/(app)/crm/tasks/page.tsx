import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { TaskListPeriod } from "@/common/constants/crm/list/task-list-periods";
import { TasksEmptyStateVariant } from "@/common/constants/crm/list/tasks-empty-state-variants";
import { canAnywhere } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { parseTaskListFilters } from "@/common/patterns/crm/task-list-search-params";
import { TasksOverviewEmptyState } from "@/components/workspace/crm/tasks/overview/tasks-overview-empty-state/tasks-overview-empty-state";
import { TasksOverviewHeader } from "@/components/workspace/crm/tasks/overview/tasks-overview-header/tasks-overview-header";
import { TasksOverviewTable } from "@/components/workspace/crm/tasks/overview/tasks-overview-table/tasks-overview-table";
import { TasksOverviewToolbar } from "@/components/workspace/crm/tasks/overview/tasks-overview-toolbar/tasks-overview-toolbar";
import { WorkspaceScrollablePageShell } from "@/components/workspace/shared/workspace-scrollable-page-shell/workspace-scrollable-page-shell";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getCrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { requireWorkspaceActor } from "@/lib/auth/permissions";
import { crmTasksPathFor, workspaceAreaPathFor } from "@/lib/auth/routes";
import { taskDueStateService } from "@/lib/workspace/crm/task-due-state-service";
import {
  buildTaskListQueryString,
  hasActiveTaskListFilters,
} from "@/lib/workspace/crm/task-list-query-string";
import { listWorkspaceMembers } from "@/server/workspace/access/query-handler/list-workspace-members.query-handler";
import { listTasks } from "@/server/workspace/crm/query-handler/list-tasks.query-handler";
import { listTaskFilterOptions } from "@/server/workspace/crm/query-handler/list-task-filter-options.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TasksPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: TasksPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }
  const meta = getCrmTasksDictionary(locale).overview.meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function TasksPage({
  params,
  searchParams,
}: TasksPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  // The layout is not re-rendered on search param changes, so the page gates its own data. Tasks
  // are bindable, so a grant on one customer or project is enough to open the overview.
  const actor = await requireWorkspaceActor(locale);
  if (!canAnywhere(actor, Permission.TasksRead)) {
    notFound();
  }

  const activeLocale: Locale = locale;
  const content = getCrmTasksDictionary(activeLocale);
  const filters = parseTaskListFilters(await searchParams);
  const basePath = crmTasksPathFor(activeLocale);
  const crmPath = workspaceAreaPathFor(activeLocale, WorkspaceArea.Crm);
  const today = taskDueStateService.businessToday();
  const hasActiveFilters = hasActiveTaskListFilters(filters);

  // Member names are only handed to actors who may list members; a task grant alone must not
  // disclose the team.
  const [list, members, filterOptions] = await Promise.all([
    listTasks(filters, actor, today),
    can(actor, Permission.MembersRead) ? listWorkspaceMembers() : [],
    listTaskFilterOptions(actor, filters.includeClosedProjects),
  ]);
  const memberOptions = members.map((member) => ({
    id: member.id,
    displayName: member.displayName,
    active: member.active,
  }));
  const writableProjectIds = [
    ...new Set(
      list.rows
        .filter((row) =>
          canOn(actor, Permission.TasksWrite, {
            customerId: row.customerId,
            projectId: row.task.projectId,
          }),
        )
        .map((row) => row.task.projectId),
    ),
  ];
  const canNavigateToCustomers = canAnywhere(actor, Permission.CustomersRead);
  // "due soon" reaches from the past up to a week ahead, so an empty result under either period
  // means the same good news: nothing overdue.
  const isNothingOverduePeriod =
    filters.period === TaskListPeriod.Overdue ||
    filters.period === TaskListPeriod.DueSoon;
  const emptyVariant =
    list.total > 0
      ? null
      : !hasActiveFilters
        ? TasksEmptyStateVariant.Empty
        : isNothingOverduePeriod
          ? TasksEmptyStateVariant.NothingOverdue
          : TasksEmptyStateVariant.NoResults;

  return (
    <WorkspaceScrollablePageShell pageId="crm-tasks">
      <TasksOverviewHeader content={content} />
      <TasksOverviewToolbar
        basePath={basePath}
        content={content}
        filters={filters}
        filterOptions={filterOptions}
        hasActiveFilters={hasActiveFilters}
        members={memberOptions.filter((member) => member.active)}
      />
      {emptyVariant ? (
        <TasksOverviewEmptyState
          actionHref={
            emptyVariant === TasksEmptyStateVariant.Empty ? crmPath : basePath
          }
          content={content}
          variant={emptyVariant}
        />
      ) : (
        <TasksOverviewTable
          basePath={basePath}
          content={content}
          crmPath={canNavigateToCustomers ? crmPath : undefined}
          list={list}
          locale={activeLocale}
          members={memberOptions}
          queryString={buildTaskListQueryString(filters)}
          today={today}
          writableProjectIds={writableProjectIds}
        />
      )}
    </WorkspaceScrollablePageShell>
  );
}
