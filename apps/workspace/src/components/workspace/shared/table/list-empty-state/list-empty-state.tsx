import Link from "next/link";
import { faFilterCircleXmark, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EmptyState, PrimaryCtaLink } from "@invessiv/ui";
import { LeadsEmptyStateVariant } from "@invessiv/common/constants/leads/list/lead-empty-state-variants";
type ListEmptyStateProps = {
  actionHref?: string;
  actionLabel: string;
  description: string;
  title: string;
  variant: LeadsEmptyStateVariant;
};

export function ListEmptyState({
  actionHref,
  actionLabel,
  description,
  title,
  variant,
}: ListEmptyStateProps) {
  const filtered = variant === LeadsEmptyStateVariant.Filtered;
  const icon = filtered ? faFilterCircleXmark : faPlus;
  return (
    <EmptyState
      description={description}
      title={title}
      icon={icon}
      variant={filtered ? "filtered" : "default"}
      action={
        actionHref ? (
          <PrimaryCtaLink href={actionHref} linkComponent={Link}>
            <FontAwesomeIcon aria-hidden="true" icon={icon} />
            {actionLabel}
          </PrimaryCtaLink>
        ) : undefined
      }
    />
  );
}
