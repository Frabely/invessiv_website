import Link from "next/link";
import {
  faCircleCheck,
  faFilterCircleXmark,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { EmptyState, PrimaryCtaLink } from "@invessiv/ui";
import { TasksEmptyStateVariant } from "@/common/constants/crm/list/tasks-empty-state-variants";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";

type TasksOverviewEmptyStateProps = {
  /** Where the action leads: the customers, or the overview without filters. */
  actionHref: string;
  content: CrmTasksDictionary;
  variant: TasksEmptyStateVariant;
};

/**
 * Three different empty screens, because they say different things: nothing was ever planned
 * (explain what the overview is for), the filters matched nothing (offer the way back), and
 * nothing is overdue (good news, not a gap).
 */
export function TasksOverviewEmptyState({
  actionHref,
  content,
  variant,
}: TasksOverviewEmptyStateProps) {
  const texts = {
    [TasksEmptyStateVariant.Empty]: content.overview.empty,
    [TasksEmptyStateVariant.NoResults]: content.overview.noResults,
    [TasksEmptyStateVariant.NothingOverdue]: content.overview.nothingOverdue,
  }[variant];
  const icon = {
    [TasksEmptyStateVariant.Empty]: faListCheck,
    [TasksEmptyStateVariant.NoResults]: faFilterCircleXmark,
    [TasksEmptyStateVariant.NothingOverdue]: faCircleCheck,
  }[variant];

  return (
    <EmptyState
      action={
        <PrimaryCtaLink
          href={actionHref}
          linkComponent={Link}
          linkComponentProps={{ scroll: false }}
        >
          {texts.action}
        </PrimaryCtaLink>
      }
      description={texts.description}
      icon={<FontAwesomeIcon icon={icon} />}
      title={texts.title}
      variant={
        variant === TasksEmptyStateVariant.NoResults ? "filtered" : undefined
      }
    />
  );
}
