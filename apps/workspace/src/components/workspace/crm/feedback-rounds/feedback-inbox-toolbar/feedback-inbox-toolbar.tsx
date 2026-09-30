"use client";

import { useRouter } from "next/navigation";
import { faArrowRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { FeedbackInboxCustomerDto } from "@invessiv/common/contracts/crm/feedback-inbox-customer.dto";
import { ButtonControl, CheckboxControl } from "@invessiv/ui";
import { FacetFilterDisplay } from "@/common/constants/ui/facet-filter-displays";
import type { FeedbackInboxFilters } from "@/common/contracts/crm/feedback-inbox-filters";
import { buildFeedbackInboxHref } from "@/common/patterns/crm/feedback-inbox-query";
import { FeedbackRoundStatusBadge } from "@/components/shared/feedback/feedback-round-status-badge/feedback-round-status-badge";
import { FacetFilter } from "@/components/workspace/shared/toolbar/facet-filter/facet-filter";
import type { CrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./feedback-inbox-toolbar.module.css";

type FeedbackInboxToolbarProps = {
  basePath: string;
  content: CrmFeedbackRoundsDictionary;
  customers: readonly FeedbackInboxCustomerDto[];
  filters: FeedbackInboxFilters;
  hasActiveFilters: boolean;
};

const STATUS_SELECT_ID = "feedback-inbox-status";
const CUSTOMER_SELECT_ID = "feedback-inbox-customer";

/** Every filter lives in the URL, so a reload or a shared link shows the same selection. */
export function FeedbackInboxToolbar({
  basePath,
  content,
  customers,
  filters,
  hasActiveFilters,
}: FeedbackInboxToolbarProps) {
  const router = useRouter();
  const toolbar = content.inbox.toolbar;
  const apply = (change: Partial<FeedbackInboxFilters>) =>
    router.push(buildFeedbackInboxHref(basePath, { ...filters, ...change }), {
      scroll: false,
    });

  return (
    <section aria-label={toolbar.ariaLabel} className={styles.toolbar}>
      <div className={styles.facets}>
        <FacetFilter
          activeValue={filters.status ?? undefined}
          allOption={{
            chip: toolbar.status.all,
            selectLabel: toolbar.status.all,
          }}
          ariaLabel={toolbar.status.ariaLabel}
          clearLabel={toolbar.clear}
          label={toolbar.status.label}
          onChangeAction={(value) =>
            apply({
              status:
                INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES.find(
                  (known) => known === value,
                ) ?? null,
            })
          }
          options={INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES.map(
            (status) => ({
              chip: (
                <FeedbackRoundStatusBadge
                  label={content.status[status]}
                  status={status}
                />
              ),
              selectLabel: content.status[status],
              value: status,
            }),
          )}
          selectId={STATUS_SELECT_ID}
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
          onChangeAction={(value) => apply({ customerId: value ?? null })}
          options={customers.map((customer) => ({
            chip: customer.displayName,
            selectLabel: customer.displayName,
            value: customer.id,
          }))}
          selectId={CUSTOMER_SELECT_ID}
        />
      </div>
      <div className={styles.bar}>
        <label className={styles.unread}>
          <CheckboxControl
            checked={filters.unreadOnly}
            onChange={(event) => apply({ unreadOnly: event.target.checked })}
          />
          <span>{toolbar.unreadOnly}</span>
        </label>
        <ButtonControl
          disabled={!hasActiveFilters}
          onClick={() => router.push(basePath, { scroll: false })}
          type="button"
          variant="ghost"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faArrowRotateLeft} />
          {toolbar.reset}
        </ButtonControl>
      </div>
    </section>
  );
}
