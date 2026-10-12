"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  OPEN_SERVICE_REQUEST_STATUS_VALUES,
  ServiceRequestStatus,
} from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestTransitionSide } from "@invessiv/common/constants/crm/service-request-transition-sides";
import { canTransitionServiceRequest } from "@invessiv/common/patterns/crm/service-request-state";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { ServiceRequestsViewModel } from "@/common/contracts/crm/service-requests-view-model";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import type { Locale } from "@/config/i18n";
import {
  ServiceRequestInboxQueryParam as Q,
  ServiceRequestDialogAction as Action,
} from "@/common/constants/crm/service-request-inbox-query-params";
import { buildServiceRequestActionHref } from "@/common/patterns/crm/service-request-inbox-query";
import { CollapsibleSection } from "@/components/workspace/crm/shared/collapsible-section/collapsible-section";
import { ServiceRequestCard } from "../service-request-card/service-request-card";
import { ServiceRequestActions } from "../service-request-actions/service-request-actions";
import { ServiceRequestAcceptDialog } from "../service-request-accept-dialog/service-request-accept-dialog";
import { ServiceRequestDeclineDialog } from "../service-request-decline-dialog/service-request-decline-dialog";
import styles from "./customer-service-requests-section.module.css";
export function CustomerServiceRequestsSection({
  viewModel,
  content,
  locale,
}: {
  viewModel: ServiceRequestsViewModel;
  content: CrmServiceRequestsDictionary;
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
  const cards = (requests: typeof viewModel.requests) =>
    requests.map((request) => (
      <ServiceRequestCard
        key={request.id + ":" + request.version}
        request={request}
        content={content}
        locale={locale}
        crmPath={pathname}
        highlighted={selected?.id === request.id}
        actions={
          viewModel.canWrite ? (
            <ServiceRequestActions request={request} content={content} />
          ) : undefined
        }
      />
    ));
  if (!viewModel.requests.length) return null;
  const canAccept =
    selected &&
    canTransitionServiceRequest(
      selected.status,
      ServiceRequestStatus.Accepted,
      ServiceRequestTransitionSide.Internal,
    );
  const canDecline =
    selected &&
    canTransitionServiceRequest(
      selected.status,
      ServiceRequestStatus.Declined,
      ServiceRequestTransitionSide.Internal,
    );
  return (
    <CollapsibleSection
      title={content.section.title}
      count={formatMessage(content.section.open, { count: open.length })}
      defaultExpanded
      expandOn={selected?.id}
      labelExpand={content.section.expand}
      labelCollapse={content.section.collapse}
      after={
        viewModel.canWrite && selected ? (
          action === Action.Accept && canAccept ? (
            <ServiceRequestAcceptDialog
              key={selected.id}
              request={selected}
              viewModel={viewModel}
              content={content}
              locale={locale}
              onCloseAction={close}
            />
          ) : action === Action.Decline && canDecline ? (
            <ServiceRequestDeclineDialog
              key={selected.id}
              request={selected}
              content={content}
              onCloseAction={close}
            />
          ) : null
        ) : null
      }
    >
      <div className={styles.list}>{cards(open)}</div>
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
          <div className={styles.list}>{cards(done)}</div>
        </CollapsibleSection>
      ) : null}
    </CollapsibleSection>
  );
}
