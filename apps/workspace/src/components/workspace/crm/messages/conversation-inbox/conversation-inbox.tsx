import Link from "next/link";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { WorkspaceMemberOptionDto } from "@invessiv/common/contracts/auth/workspace-member-option.dto";
import type { ConversationInboxItemDto } from "@invessiv/common/contracts/crm/conversation-inbox-item.dto";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import {
  CONVERSATION_INBOX_FILTER_VALUES,
  ConversationInboxFilter,
} from "@/common/constants/crm/conversation-inbox-filters";
import { buildConversationInboxHref } from "@/common/patterns/crm/conversation-inbox-query";
import type { Locale } from "@/config/i18n";
import type {
  CrmFilesDictionary,
  CrmMessagesDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ConversationListItem } from "../conversation-list-item/conversation-list-item";
import { ConversationOwnerSelect } from "../conversation-owner-select/conversation-owner-select";
import { CustomerConversation } from "../customer-conversation/customer-conversation";
import styles from "./conversation-inbox.module.css";

const FILTER_LABELS = {
  [ConversationInboxFilter.All]: "filterAll",
  [ConversationInboxFilter.Mine]: "filterMine",
} as const satisfies Record<
  ConversationInboxFilter,
  keyof CrmMessagesDictionary["inbox"]
>;

type ConversationInboxProps = {
  basePath: string;
  /** True only with `chat.redact`. */
  canRedact: boolean;
  /** True only with `chat.write` on the selected customer. */
  canWriteSelected: boolean;
  /** Link into the customer record; null without `customers.read` on the customer. */
  cockpitHref: string | null;
  content: CrmMessagesDictionary;
  /** Upload labels and file errors for attachments in the selected conversation. */
  filesContent: CrmFilesDictionary;
  filter: ConversationInboxFilter;
  /** Distinguishes "nothing yet" from "nothing for this filter". */
  hasAnyConversation: boolean;
  items: readonly ConversationInboxItemDto[];
  locale: Locale;
  /** Empty without the right to reassign; the select is then not rendered. */
  ownerCandidates: readonly WorkspaceMemberOptionDto[];
  selected: InternalConversationDto | null;
  selectedCustomerName: string | null;
  viewerMemberId: string;
};

export function ConversationInbox({
  basePath,
  canRedact,
  canWriteSelected,
  cockpitHref,
  content,
  filesContent,
  filter,
  hasAnyConversation,
  items,
  locale,
  ownerCandidates,
  selected,
  selectedCustomerName,
  viewerMemberId,
}: ConversationInboxProps) {
  const text = content.inbox;
  const listHref = buildConversationInboxHref(basePath, {
    customerId: null,
    filter,
  });

  return (
    <div className={styles.inbox} data-view={selected ? "thread" : "list"}>
      <section
        aria-labelledby="conversation-list-heading"
        className={styles.list}
      >
        <div className={styles.listHead}>
          <h2 className={styles.listTitle} id="conversation-list-heading">
            {text.listLabel}
          </h2>
          <nav aria-label={text.filterLabel} className={styles.filters}>
            {CONVERSATION_INBOX_FILTER_VALUES.map((value) => (
              <Link
                aria-current={value === filter ? "page" : undefined}
                className={styles.filter}
                data-active={value === filter}
                href={buildConversationInboxHref(basePath, {
                  customerId: selected?.customerId ?? null,
                  filter: value,
                })}
                key={value}
                scroll={false}
              >
                {text[FILTER_LABELS[value]]}
              </Link>
            ))}
          </nav>
        </div>
        {items.length > 0 ? (
          <ul className={styles.items}>
            {items.map((item) => (
              <ConversationListItem
                content={content}
                href={buildConversationInboxHref(basePath, {
                  customerId: item.customerId,
                  filter,
                })}
                item={item}
                key={item.id}
                locale={locale}
                selected={item.customerId === selected?.customerId}
              />
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>
              {hasAnyConversation ? text.emptyFilteredTitle : text.emptyTitle}
            </p>
            <p>
              {hasAnyConversation ? text.emptyFilteredBody : text.emptyBody}
            </p>
            {hasAnyConversation ? (
              <Link
                className={styles.emptyAction}
                href={buildConversationInboxHref(basePath, {
                  customerId: null,
                  filter: ConversationInboxFilter.All,
                })}
              >
                {text.showAll}
              </Link>
            ) : null}
          </div>
        )}
      </section>
      <section
        aria-labelledby={selected ? "conversation-thread-heading" : undefined}
        className={styles.thread}
      >
        {selected ? (
          <>
            <header className={styles.threadHead}>
              <Link className={styles.back} href={listHref} scroll={false}>
                <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
                {text.backToList}
              </Link>
              <div className={styles.threadTitleRow}>
                <h2
                  className={styles.threadTitle}
                  id="conversation-thread-heading"
                >
                  {selectedCustomerName}
                </h2>
                {cockpitHref ? (
                  <Link className={styles.cockpitLink} href={cockpitHref}>
                    {text.openCockpit}
                  </Link>
                ) : null}
              </div>
              {selected.ownership && ownerCandidates.length > 0 ? (
                <ConversationOwnerSelect
                  assignment={{
                    ownerMemberId: selected.ownership.ownerMemberId,
                    version: selected.ownership.version,
                  }}
                  candidates={ownerCandidates}
                  content={content.owner}
                  customerId={selected.customerId}
                  key={`${selected.id}:${selected.ownership.version}`}
                  ownerDisplayName={selected.ownership.ownerDisplayName}
                />
              ) : selected.ownership ? (
                <p className={styles.ownerText}>
                  {formatMessage(text.responsible, {
                    name: selected.ownership.ownerDisplayName,
                  })}
                </p>
              ) : null}
            </header>
            <div className={styles.threadBody}>
              <CustomerConversation
                active
                canRedact={canRedact}
                canWrite={canWriteSelected}
                content={content}
                customerId={selected.customerId}
                filesContent={filesContent}
                initialConversation={selected}
                key={`${viewerMemberId}:${selected.customerId}`}
                locale={locale}
                viewerMemberId={viewerMemberId}
              />
            </div>
          </>
        ) : (
          <p className={styles.prompt}>
            {items.length > 0 ? text.selectPrompt : null}
          </p>
        )}
      </section>
    </div>
  );
}
