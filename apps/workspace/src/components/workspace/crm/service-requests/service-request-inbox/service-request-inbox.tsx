import Link from "next/link";
import { faBellConcierge } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EmptyState, ButtonLink } from "@invessiv/ui";
import type { ServiceRequestInboxDto } from "@invessiv/common/contracts/crm/service-requests/service-request-inbox.dto";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceRequestInboxFilter as F } from "@/common/constants/crm/service-request-inbox-query-params";
import { buildServiceRequestInboxHref } from "@/common/patterns/crm/service-request-inbox-query";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import type { Locale } from "@/config/i18n";
import { ServiceRequestInboxToolbar } from "../service-request-inbox-toolbar/service-request-inbox-toolbar";
import { ServiceRequestCard } from "../service-request-card/service-request-card";
import styles from "./service-request-inbox.module.css";
export function ServiceRequestInbox({
  basePath,
  crmPath,
  filter,
  inbox,
  locale,
  content,
}: {
  basePath: string;
  crmPath: string;
  filter: F;
  inbox: ServiceRequestInboxDto;
  locale: Locale;
  content: CrmServiceRequestsDictionary;
}) {
  const empty = inbox.hasRequests ? content.noOpen : content.empty;
  return (
    <>
      <header className={styles.header}>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
      </header>
      <ServiceRequestInboxToolbar
        basePath={basePath}
        filter={filter}
        content={content}
      />
      {inbox.items.length === 0 ? (
        <EmptyState
          title={empty.title}
          description={empty.description}
          icon={<FontAwesomeIcon icon={faBellConcierge} />}
          action={
            inbox.hasRequests ? (
              <ButtonLink
                href={buildServiceRequestInboxHref(basePath, F.All)}
                linkComponent={Link}
              >
                {content.noOpen.action}
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <ul className={styles.list}>
          {inbox.items.map((r) => (
            <li key={r.id}>
              <ServiceRequestCard
                request={r}
                locale={locale}
                content={content}
                crmPath={crmPath}
                href={buildCustomerCockpitHref(crmPath, r.customerId, "", {
                  serviceRequestId: r.id,
                })}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
