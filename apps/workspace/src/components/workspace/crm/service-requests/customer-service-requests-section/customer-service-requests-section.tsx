"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  OPEN_SERVICE_REQUEST_STATUS_VALUES,
  ServiceRequestStatus,
} from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestTransitionSide } from "@invessiv/common/constants/crm/service-request-transition-sides";
import { canTransitionServiceRequest } from "@invessiv/common/patterns/crm/service-request-state";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { ServiceRequestsViewModel } from "@/common/contracts/crm/service-requests-view-model";
import type {
  CrmProjectLineItemsDictionary,
  CrmServiceRequestsDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import type { Locale } from "@/config/i18n";
import {
  ServiceRequestInboxQueryParam as Q,
  ServiceRequestDialogAction as Action,
} from "@/common/constants/crm/service-request-inbox-query-params";
import { buildServiceRequestActionHref } from "@/common/patterns/crm/service-request-inbox-query";
import { CollapsibleSection } from "@/components/workspace/crm/shared/collapsible-section/collapsible-section";
import { StatusRow } from "@/components/workspace/shared/status-row/status-row";
import { ServiceRequestDetails } from "../service-request-details/service-request-details";
import { ServiceRequestStatusBadge } from "@/components/shared/service-requests/service-request-status-badge/service-request-status-badge";
import { ServiceRequestActions } from "../service-request-actions/service-request-actions";
import { ServiceRequestAcceptDialog } from "../service-request-accept-dialog/service-request-accept-dialog";
import { ServiceRequestDeclineDialog } from "../service-request-decline-dialog/service-request-decline-dialog";
import { ServiceRequestOfferDialog } from "../service-request-offer-dialog/service-request-offer-dialog";
import { ServiceRequestWithdrawDialog } from "../service-request-withdraw-dialog/service-request-withdraw-dialog";
import styles from "./customer-service-requests-section.module.css";
export function CustomerServiceRequestsSection({
  viewModel,
  content,
  lineItemsContent,
  locale,
}: {
  viewModel: ServiceRequestsViewModel;
  content: CrmServiceRequestsDictionary;
  /** Labels of the shared line item fields the offer and the acceptance dialog reuse. */
  lineItemsContent: CrmProjectLineItemsDictionary;
  locale: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = viewModel.requests.find(
    (r) => r.id === params.get(Q.Request),
  );
  const action = params.get(Q.Action);
  const open = viewModel.requests.filter((r) =>
    OPEN_SERVICE_REQUEST_STATUS_VALUES.some((s) => s === r.status),
  );
  const done = viewModel.requests.filter(
    (r) => !OPEN_SERVICE_REQUEST_STATUS_VALUES.some((s) => s === r.status),
  );
  const close = () => {
    if (selected)
      router.replace(
        buildServiceRequestActionHref(
          pathname,
          params.toString(),
          selected.id,
          null,
        ),
        { scroll: false },
      );
  };
  // Completed requests allow no transition, so they get no action column at all.
  const rows = (
    requests: readonly ServiceRequestDto[],
    withActions: boolean,
  ) => (
    <ul className={styles.list}>
      {requests.map((request) => (
        <StatusRow
          alignStart
          key={request.id + ":" + request.version}
          selected={selected?.id === request.id}
          status={
            <ServiceRequestStatusBadge
              label={content.status[request.status]}
              status={request.status}
            />
          }
          trailing={
            withActions ? (
              <ServiceRequestActions request={request} content={content} />
            ) : undefined
          }
        >
          <ServiceRequestDetails
            content={content}
            crmPath={pathname}
            locale={locale}
            request={request}
          />
        </StatusRow>
      ))}
    </ul>
  );
  if (!viewModel.requests.length) return null;
  const dialog = viewModel.canWrite && selected ? openDialog(selected) : null;
  // A dialog only opens for a transition the request still allows; a stale link opens nothing.
  function openDialog(request: ServiceRequestDto) {
    const allows = (to: ServiceRequestStatus) =>
      canTransitionServiceRequest(
        request.status,
        to,
        ServiceRequestTransitionSide.Internal,
      );
    const shared = {
      key: request.id,
      request,
      content,
      onCloseAction: close,
    };
    if (action === Action.Offer && allows(ServiceRequestStatus.Offered))
      return (
        <ServiceRequestOfferDialog
          {...shared}
          viewModel={viewModel}
          lineItemsContent={lineItemsContent}
          locale={locale}
        />
      );
    if (action === Action.Accept && allows(ServiceRequestStatus.Accepted))
      return (
        <ServiceRequestAcceptDialog
          {...shared}
          viewModel={viewModel}
          lineItemsContent={lineItemsContent}
          locale={locale}
        />
      );
    if (action === Action.Withdraw && allows(ServiceRequestStatus.Withdrawn))
      return <ServiceRequestWithdrawDialog {...shared} />;
    if (action === Action.Decline && allows(ServiceRequestStatus.Declined))
      return <ServiceRequestDeclineDialog {...shared} />;
    return null;
  }
  return (
    <CollapsibleSection
      title={content.section.title}
      count={formatMessage(content.section.open, { count: open.length })}
      defaultExpanded
      expandOn={selected?.id}
      labelExpand={content.section.expand}
      labelCollapse={content.section.collapse}
      after={dialog}
    >
      {open.length ? rows(open, viewModel.canWrite) : null}
      {done.length ? (
        <CollapsibleSection
          title={formatMessage(content.section.completed, {
            count: done.length,
          })}
          defaultExpanded={done.some((r) => r.id === selected?.id)}
          expandOn={
            done.some((r) => r.id === selected?.id) ? selected?.id : null
          }
          labelExpand={content.section.expandCompleted}
          labelCollapse={content.section.collapseCompleted}
        >
          {rows(done, false)}
        </CollapsibleSection>
      ) : null}
    </CollapsibleSection>
  );
}
