import Link from "next/link";
import {
  faBellConcierge,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

import type { ServiceRequestInboxDto } from "@invessiv/common/contracts/crm/service-requests/service-request-inbox.dto";
import { EmptyState, PrimaryCtaLink } from "@invessiv/ui";
import { ServiceRequestInboxFilter as F } from "@/common/constants/crm/service-request-inbox-query-params";
import { buildServiceRequestInboxHref } from "@/common/patterns/crm/service-request-inbox-query";
import { ListPageHeader } from "@/components/workspace/crm/shared/list-page-header/list-page-header";
import type { Locale } from "@/config/i18n";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceRequestInboxTable } from "../service-request-inbox-table/service-request-inbox-table";
import { ServiceRequestInboxToolbar } from "../service-request-inbox-toolbar/service-request-inbox-toolbar";

type ServiceRequestInboxProps = {
  basePath: string;
  content: CrmServiceRequestsDictionary;
  crmPath: string;
  filter: F;
  inbox: ServiceRequestInboxDto;
  locale: Locale;
};

/**
 * Every request the actor may see. The two empty screens say different things: nothing was ever
 * requested (explain what lands here), or nothing is open (good news, with the way to the rest).
 */
export function ServiceRequestInbox({
  basePath,
  content,
  crmPath,
  filter,
  inbox,
  locale,
}: ServiceRequestInboxProps) {
  return (
    <>
      <ListPageHeader description={content.description} title={content.title} />
      {inbox.hasRequests ? (
        <ServiceRequestInboxToolbar
          basePath={basePath}
          content={content}
          filter={filter}
        />
      ) : null}
      {inbox.items.length > 0 ? (
        <ServiceRequestInboxTable
          basePath={basePath}
          content={content}
          crmPath={crmPath}
          filter={filter}
          inbox={inbox}
          locale={locale}
        />
      ) : inbox.hasRequests ? (
        <EmptyState
          action={
            <PrimaryCtaLink
              href={buildServiceRequestInboxHref(basePath, F.All)}
              linkComponent={Link}
              linkComponentProps={{ scroll: false }}
            >
              {content.noOpen.action}
            </PrimaryCtaLink>
          }
          description={content.noOpen.description}
          icon={faCircleCheck}
          title={content.noOpen.title}
        />
      ) : (
        <EmptyState
          description={content.empty.description}
          icon={faBellConcierge}
          title={content.empty.title}
        />
      )}
    </>
  );
}
