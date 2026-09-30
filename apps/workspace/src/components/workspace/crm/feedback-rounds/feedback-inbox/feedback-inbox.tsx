import Link from "next/link";
import {
  faCircleCheck,
  faFilterCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { FeedbackInboxDto } from "@invessiv/common/contracts/crm/feedback-inbox.dto";
import { EmptyState, PrimaryCtaLink } from "@invessiv/ui";
import type { FeedbackInboxFilters } from "@/common/contracts/crm/feedback-inbox-filters";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import type { Locale } from "@/config/i18n";
import type { CrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FeedbackInboxCard } from "../feedback-inbox-card/feedback-inbox-card";
import { FeedbackInboxToolbar } from "../feedback-inbox-toolbar/feedback-inbox-toolbar";
import styles from "./feedback-inbox.module.css";

type FeedbackInboxProps = {
  /** The inbox itself; the reset link of the filtered empty state leads back here. */
  basePath: string;
  content: CrmFeedbackRoundsDictionary;
  /** CRM overview; every card opens the customer cockpit below it. */
  crmPath: string;
  filters: FeedbackInboxFilters;
  hasActiveFilters: boolean;
  inbox: FeedbackInboxDto;
  locale: Locale;
};

/**
 * All rounds the team is on turn for. The two empty screens say different things: nothing waits
 * (good news), or the filter hides what waits (offer the way back).
 */
export function FeedbackInbox({
  basePath,
  content,
  crmPath,
  filters,
  hasActiveFilters,
  inbox,
  locale,
}: FeedbackInboxProps) {
  const texts = content.inbox;
  const emptyTexts = hasActiveFilters ? texts.noResults : texts.empty;

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{texts.title}</h1>
        <p className={styles.description}>{texts.description}</p>
      </header>
      <FeedbackInboxToolbar
        basePath={basePath}
        content={content}
        customers={inbox.customers}
        filters={filters}
        hasActiveFilters={hasActiveFilters}
      />
      {inbox.items.length === 0 ? (
        <EmptyState
          action={
            <PrimaryCtaLink
              href={hasActiveFilters ? basePath : crmPath}
              linkComponent={Link}
              linkComponentProps={{ scroll: false }}
            >
              {emptyTexts.action}
            </PrimaryCtaLink>
          }
          description={emptyTexts.description}
          icon={
            <FontAwesomeIcon
              icon={hasActiveFilters ? faFilterCircleXmark : faCircleCheck}
            />
          }
          title={emptyTexts.title}
          variant={hasActiveFilters ? "filtered" : undefined}
        />
      ) : (
        <ul aria-label={texts.listLabel} className={styles.list}>
          {inbox.items.map((item) => (
            <FeedbackInboxCard
              content={content}
              href={buildCustomerCockpitHref(crmPath, item.customerId, "", {
                projectId: item.projectId,
                feedbackRoundId: item.id,
              })}
              item={item}
              key={item.id}
              locale={locale}
            />
          ))}
        </ul>
      )}
    </>
  );
}
