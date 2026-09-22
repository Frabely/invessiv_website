"use client";

import { useRouter } from "next/navigation";
import {
  faArrowRotateLeft,
  faCalendarDay,
  faCalendarDays,
  faCalendarWeek,
  faChevronDown,
  faClock,
  faTriangleExclamation,
  faUser,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TASK_ACTION_SIDE_VALUES } from "@invessiv/common/constants/crm/task-action-sides";
import {
  BadgeTone,
  type BadgeTone as BadgeToneValue,
} from "@invessiv/common/constants/ui/badge-tones";
import { Badge, ButtonControl, CheckboxControl } from "@invessiv/ui";
import { TaskFilterSelectId } from "@/common/constants/crm/list/task-filter-select-ids";
import { TASK_LIST_ASSIGNEE_ME } from "@/common/constants/crm/list/task-list-assignee";
import {
  TASK_LIST_PERIOD_VALUES,
  TaskListPeriod,
} from "@/common/constants/crm/list/task-list-periods";
import {
  TASK_LIST_STATUS_FILTER_VALUES,
  TaskListStatusFilter,
} from "@/common/constants/crm/list/task-list-status-filters";
import { FacetFilterDisplay } from "@/common/constants/ui/facet-filter-displays";
import type { TaskListFilterOptions } from "@/common/contracts/crm/task-list-filter-options";
import type { TaskListFilters } from "@/common/contracts/crm/task-list-filters";
import type { TaskAssigneeOption } from "@/common/contracts/crm/tasks-view-model";
import { DEFAULT_TASK_LIST_FILTERS } from "@/common/defaults/crm/task-list-default-filters";
import { TaskActionSideBadge } from "@/components/workspace/crm/tasks/task-action-side-badge/task-action-side-badge";
import { TaskStatusBadge } from "@/components/workspace/crm/tasks/task-status-badge/task-status-badge";
import { FacetFilter } from "@/components/workspace/shared/toolbar/facet-filter/facet-filter";
import { ListSearchField } from "@/components/workspace/shared/toolbar/list-search-field/list-search-field";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { buildTaskListHref } from "@/lib/workspace/crm/task-list-query-string";
import styles from "./tasks-overview-toolbar.module.css";

type TasksOverviewToolbarProps = {
  basePath: string;
  content: CrmTasksDictionary;
  filterOptions: TaskListFilterOptions;
  filters: TaskListFilters;
  hasActiveFilters: boolean;
  members: readonly TaskAssigneeOption[];
};

const PERIOD_BADGE_CONFIG = {
  [TaskListPeriod.All]: { icon: faCalendarDays, tone: BadgeTone.Neutral },
  [TaskListPeriod.Overdue]: {
    icon: faTriangleExclamation,
    tone: BadgeTone.Danger,
  },
  [TaskListPeriod.Today]: { icon: faCalendarDay, tone: BadgeTone.Warning },
  [TaskListPeriod.Week]: { icon: faCalendarWeek, tone: BadgeTone.Info },
  [TaskListPeriod.DueSoon]: { icon: faClock, tone: BadgeTone.Orange },
} as const satisfies Record<
  TaskListPeriod,
  { icon: IconDefinition; tone: BadgeToneValue }
>;

const ASSIGNEE_BADGE_CONFIG = {
  mine: { icon: faUserCheck, tone: BadgeTone.Primary },
  member: { icon: faUser, tone: BadgeTone.Neutral },
} as const satisfies Record<
  "mine" | "member",
  { icon: IconDefinition; tone: BadgeToneValue }
>;

export function TasksOverviewToolbar({
  basePath,
  content,
  filterOptions,
  filters,
  hasActiveFilters,
  members,
}: TasksOverviewToolbarProps) {
  const router = useRouter();
  const toolbar = content.overview.toolbar;
  const apply = (change: Partial<TaskListFilters>) =>
    router.push(
      buildTaskListHref(basePath, {
        ...filters,
        ...change,
        page: DEFAULT_TASK_LIST_FILTERS.page,
      }),
      { scroll: false },
    );

  return (
    <section aria-label={toolbar.ariaLabel} className={styles.toolbar}>
      <div className={styles.bar}>
        <ButtonControl
          aria-label={toolbar.actions.reset}
          className={styles.barButton}
          disabled={!hasActiveFilters}
          onClick={() => router.push(basePath, { scroll: false })}
          type="button"
          variant="ghost"
        >
          <span aria-hidden="true" className={styles.buttonIcon}>
            <FontAwesomeIcon icon={faArrowRotateLeft} />
          </span>
          <span className={styles.label}>{toolbar.actions.reset}</span>
        </ButtonControl>
      </div>
      <details className={styles.filters}>
        <summary className={styles.filterToggle}>
          <span aria-hidden="true" className={styles.buttonIcon}>
            <FontAwesomeIcon
              className={styles.collapseIcon}
              icon={faChevronDown}
            />
          </span>
          <span className={styles.label}>{toolbar.ariaLabel}</span>
        </summary>
        <div className={styles.panel}>
          <div className={styles.primaryFilters}>
            <ListSearchField
              currentValue={filters.search}
              label={toolbar.search.label}
              onCommitAction={(value) => apply({ search: value ?? "" })}
              placeholder={toolbar.search.placeholder}
            />
            <label className={styles.closedProjects}>
              <CheckboxControl
                checked={filters.includeClosedProjects}
                onChange={(event) =>
                  apply({ includeClosedProjects: event.target.checked })
                }
              />
              <span>{toolbar.closedProjects}</span>
            </label>
          </div>
          <div className={styles.facetGroups}>
            <FacetFilter
              activeValue={
                filters.status === TaskListStatusFilter.Active
                  ? undefined
                  : filters.status
              }
              allOption={{
                chip: (
                  <TaskStatusBadge
                    label={toolbar.status.options.active}
                    status={TaskListStatusFilter.Active}
                  />
                ),
                selectLabel: toolbar.status.options.active,
              }}
              ariaLabel={toolbar.status.ariaLabel}
              clearLabel={toolbar.clear}
              label={toolbar.status.label}
              onChangeAction={(value) =>
                apply({
                  status:
                    TASK_LIST_STATUS_FILTER_VALUES.find(
                      (known) => known === value,
                    ) ?? TaskListStatusFilter.Active,
                })
              }
              options={TASK_LIST_STATUS_FILTER_VALUES.filter(
                (status) => status !== TaskListStatusFilter.Active,
              ).map((status) => ({
                chip: (
                  <TaskStatusBadge
                    label={toolbar.status.options[status]}
                    status={status}
                  />
                ),
                selectLabel: toolbar.status.options[status],
                value: status,
              }))}
              selectId={TaskFilterSelectId.Status}
            />
            <FacetFilter
              activeValue={
                filters.period === TaskListPeriod.All
                  ? undefined
                  : filters.period
              }
              allOption={{
                chip: (
                  <Badge
                    icon={PERIOD_BADGE_CONFIG[TaskListPeriod.All].icon}
                    kind="period"
                    label={toolbar.period.options.all}
                    tone={PERIOD_BADGE_CONFIG[TaskListPeriod.All].tone}
                  />
                ),
                selectLabel: toolbar.period.options.all,
              }}
              ariaLabel={toolbar.period.ariaLabel}
              clearLabel={toolbar.clear}
              label={toolbar.period.label}
              onChangeAction={(value) =>
                apply({
                  period:
                    TASK_LIST_PERIOD_VALUES.find((known) => known === value) ??
                    TaskListPeriod.All,
                })
              }
              options={TASK_LIST_PERIOD_VALUES.filter(
                (period) => period !== TaskListPeriod.All,
              ).map((period) => ({
                chip: (
                  <Badge
                    icon={PERIOD_BADGE_CONFIG[period].icon}
                    kind="period"
                    label={toolbar.period.options[period]}
                    tone={PERIOD_BADGE_CONFIG[period].tone}
                  />
                ),
                selectLabel: toolbar.period.options[period],
                value: period,
              }))}
              selectId={TaskFilterSelectId.Period}
            />
            <FacetFilter
              activeValue={filters.actionSide ?? undefined}
              allOption={{
                chip: (
                  <TaskStatusBadge
                    label={toolbar.side.all}
                    status={TaskListStatusFilter.All}
                  />
                ),
                selectLabel: toolbar.side.all,
              }}
              ariaLabel={toolbar.side.ariaLabel}
              clearLabel={toolbar.clear}
              label={toolbar.side.label}
              onChangeAction={(value) =>
                apply({
                  actionSide:
                    TASK_ACTION_SIDE_VALUES.find((known) => known === value) ??
                    null,
                })
              }
              options={TASK_ACTION_SIDE_VALUES.map((side) => ({
                chip: (
                  <TaskActionSideBadge actionSide={side} content={content} />
                ),
                selectLabel: content.actionSide[side],
                value: side,
              }))}
              selectId={TaskFilterSelectId.Side}
            />
            <FacetFilter
              activeValue={filters.assignee ?? undefined}
              allOption={{
                chip: (
                  <TaskStatusBadge
                    label={toolbar.assignee.all}
                    status={TaskListStatusFilter.All}
                  />
                ),
                selectLabel: toolbar.assignee.all,
              }}
              ariaLabel={toolbar.assignee.ariaLabel}
              clearLabel={toolbar.clear}
              label={toolbar.assignee.label}
              onChangeAction={(value) => apply({ assignee: value ?? null })}
              options={[
                {
                  chip: (
                    <Badge
                      icon={ASSIGNEE_BADGE_CONFIG.mine.icon}
                      kind="assignee"
                      label={toolbar.assignee.me}
                      tone={ASSIGNEE_BADGE_CONFIG.mine.tone}
                    />
                  ),
                  selectLabel: toolbar.assignee.me,
                  value: TASK_LIST_ASSIGNEE_ME,
                },
                ...members.map((member) => ({
                  chip: (
                    <Badge
                      icon={ASSIGNEE_BADGE_CONFIG.member.icon}
                      kind="assignee"
                      label={member.displayName}
                      tone={ASSIGNEE_BADGE_CONFIG.member.tone}
                    />
                  ),
                  selectLabel: member.displayName,
                  value: member.id,
                })),
              ]}
              selectId={TaskFilterSelectId.Assignee}
            />
            <FacetFilter
              activeValue={filters.customerId ?? undefined}
              allOption={{
                chip: toolbar.customer.all,
                selectLabel: toolbar.customer.all,
              }}
              ariaLabel={toolbar.customer.ariaLabel}
              clearLabel={toolbar.clear}
              display={FacetFilterDisplay.Select}
              label={toolbar.customer.label}
              onChangeAction={(value) =>
                apply({ customerId: value ?? null, projectId: null })
              }
              options={filterOptions.customers.map((customer) => ({
                chip: customer.displayName,
                selectLabel: customer.displayName,
                value: customer.id,
              }))}
              selectId={TaskFilterSelectId.Customer}
            />
            <FacetFilter
              activeValue={filters.projectId ?? undefined}
              allOption={{
                chip: toolbar.project.all,
                selectLabel: toolbar.project.all,
              }}
              ariaLabel={toolbar.project.ariaLabel}
              clearLabel={toolbar.clear}
              display={FacetFilterDisplay.Select}
              label={toolbar.project.label}
              onChangeAction={(value) => apply({ projectId: value ?? null })}
              options={filterOptions.projects
                .filter(
                  (project) =>
                    !filters.customerId ||
                    project.customerId === filters.customerId,
                )
                .map((project) => ({
                  chip: project.title,
                  selectLabel: project.title,
                  value: project.id,
                }))}
              selectId={TaskFilterSelectId.Project}
            />
          </div>
        </div>
      </details>
    </section>
  );
}
